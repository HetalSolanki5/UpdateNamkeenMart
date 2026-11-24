import crypto from 'crypto';
import mongoose from 'mongoose';
import {
  Order,
  OrderItem,
  Payment,
  Invoice,
  Cart,
  CartItem,
  Variant,
  Stock,
  Product,
  User
} from '../models/index.js';
import { generateOrderNumber, generateInvoiceNumber } from '../utils/generateCode.js';
import {
  getActiveOfferForProduct,
  applyDiscount,
  getActiveCartThresholdOffer,
  applyCartDiscount,
  getBestWholeOrderOffer
} from '../utils/offerCalculator.js';
import razorpay from '../config/razorpay.js';
import { env } from '../config/env.js';

// ─────────────────────────────────────────────────────────────────────────────
// PRIVATE HELPER — shared by createOrderFromCart, initiateRazorpayOrder, and
// verifyAndCreateOrder to avoid duplicating cart validation logic three times.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates the user's cart and computes the order total from fresh DB prices.
 *
 * Checks:
 *  1. User role is "customer".
 *  2. Address exists in user.addresses.
 *  3. Cart exists and is not empty.
 *  4. Every cart item has an active variant and product.
 *  5. Every cart item has sufficient stock available.
 *
 * Returns { freshUser, foundAddress, cart, cartItems, validatedItems, totalAmount }.
 * Throws descriptive errors with .status set so controllers can forward them directly.
 *
 * NOTE: This function does NOT reduce stock. Stock reduction happens separately
 * inside the actual order-creation step so we never reduce stock before we are
 * sure we are going to create the order.
 */
const validateCartAndComputeTotal = async (user, { addressId }) => {
  // 1. Double-check user role
  if (!user || user.role !== 'customer') {
    const err = new Error('Only customers can place orders.');
    err.status = 403;
    throw err;
  }

  // Reload fresh user from DB to ensure addresses are up-to-date
  const freshUser = await User.findById(user._id);
  if (!freshUser) {
    const err = new Error('User not found.');
    err.status = 404;
    throw err;
  }

  // 2. Find delivery address in user.addresses
  const foundAddress = freshUser.addresses.id(addressId);
  if (!foundAddress) {
    const err = new Error('Delivery address not found.');
    err.status = 400;
    throw err;
  }

  // 3. Load user's Cart and CartItems
  const cart = await Cart.findOne({ userId: freshUser._id });
  if (!cart) {
    const err = new Error('Your cart is empty.');
    err.status = 400;
    throw err;
  }

  const cartItems = await CartItem.find({ cartId: cart._id });
  if (!cartItems || cartItems.length === 0) {
    const err = new Error('Your cart is empty.');
    err.status = 400;
    throw err;
  }

  // 4. Validate all cart items with fresh data from DB
  const validatedItems = [];

  for (const item of cartItems) {
    const variant = await Variant.findById(item.variantId);
    if (!variant || !variant.isActive) {
      const err = new Error('One of the items in your cart is no longer available.');
      err.status = 400;
      throw err;
    }

    const product = await Product.findById(variant.productId);
    if (!product || !product.isActive) {
      const err = new Error(`Product for ${variant.displayName || 'variant'} is no longer available.`);
      err.status = 400;
      throw err;
    }

    const stock = await Stock.findOne({ variantId: variant._id });
    if (!stock) {
      const err = new Error(`Stock record not found for ${variant.displayName || 'item'}.`);
      err.status = 400;
      throw err;
    }

    const available = (stock.availableQuantity || 0) - (stock.reservedQuantity || 0);
    if (available < item.quantity) {
      const err = new Error(
        `Insufficient stock for ${variant.displayName || product.productName}. Available: ${available}, requested: ${item.quantity}`
      );
      err.status = 400;
      throw err;
    }

    // Never trust frontend prices: read directly from database.
    // In addition, recalculate active festival/seasonal offers fresh from the database at checkout time.
    // Even if a malicious client tampered with cart item prices or invented a fake discount,
    // we query active Offer documents right now and apply the legitimate discount to variant.sellingPrice.
    const activeOffer = await getActiveOfferForProduct(product);
    const discountInfo = applyDiscount(variant.sellingPrice, activeOffer);
    const unitPrice = discountInfo.finalPrice;
    const itemSubtotal = unitPrice * item.quantity;

    validatedItems.push({
      item,
      variant,
      product,
      stock,
      quantity: item.quantity,
      unitPrice,
      subtotal: itemSubtotal,
      appliedOfferName: discountInfo.offerName || null
    });
  }

  const subtotalBeforeCartDiscount = validatedItems.reduce((sum, item) => sum + item.subtotal, 0);

  // PHASE 10E & 10G: Whole-order discount recalculation at order time
  // "Never trust frontend prices or discounts":
  // We call getBestWholeOrderOffer to evaluate both cart-threshold and customer loyalty
  // offers fresh from the database against the authenticated user and subtotal.
  // This single decision point prevents any frontend tampering or duplicate rule evaluation.
  const bestWholeOffer = await getBestWholeOrderOffer(freshUser._id, subtotalBeforeCartDiscount);
  const cartDiscountInfo = applyCartDiscount(subtotalBeforeCartDiscount, bestWholeOffer);
  const totalAmount = cartDiscountInfo.finalSubtotal;

  return {
    freshUser,
    foundAddress,
    cart,
    cartItems,
    validatedItems,
    subtotalBeforeCartDiscount,
    cartDiscountAmount: cartDiscountInfo.discountAmount,
    appliedCartOfferName: cartDiscountInfo.offerName || null,
    totalAmount
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// PRIVATE HELPER — shared stock-reduce + Order/OrderItem/Payment/Invoice/Cart
// clear logic used by both createOrderFromCart and verifyAndCreateOrder.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Reduces stock, creates Order, OrderItems, Payment, Invoice, and clears the cart.
 *
 * @param {object} freshUser      - User document from DB
 * @param {object} foundAddress   - Embedded address subdocument
 * @param {object} cart           - Cart document
 * @param {Array}  validatedItems - Items produced by validateCartAndComputeTotal
 * @param {number} totalAmount    - Pre-computed total
 * @param {object} paymentDetails - { method, status, transactionId }
 * @returns {{ order, orderItems, payment, invoice }}
 *
 * NOTE ON STOCK TRANSACTIONS & ROLLBACK:
 * In production multi-server MongoDB setups, replica sets enable native multi-document
 * ACID transactions (session.startTransaction()). However, in single-node local MongoDB
 * environments (often used in student or local development setups without replica sets),
 * transactions throw "Transactions are not supported by this deployment".
 * Therefore, we implement a compensating rollback pattern: we keep track of all stock
 * reductions and, in case of any subsequent failure before checkout completion, we
 * immediately restore the reduced quantities back to the Stock collection.
 */
const reduceStockAndCreateDocuments = async (
  freshUser,
  foundAddress,
  cart,
  validatedItems,
  totalAmount,
  paymentDetails,
  cartOfferDetails = {}
) => {
  // Track reduced stocks for compensating rollback in case of subsequent errors
  const reducedStocks = [];

  try {
    // 5. Reduce stock for each item
    for (const valItem of validatedItems) {
      valItem.stock.availableQuantity -= valItem.quantity;
      await valItem.stock.save();
      reducedStocks.push({
        stockId: valItem.stock._id,
        quantity: valItem.quantity
      });
    }

    // 6. Compute delivery charge
    const deliveryCharge = 0; // Fixed flat placeholder

    // 7. Create Order document
    const orderNumber = generateOrderNumber();
    const order = await Order.create({
      orderNumber,
      userId: freshUser._id,
      customerSnapshot: {
        name: freshUser.name,
        phone: freshUser.phone,
        email: freshUser.email
      },
      deliveryAddressSnapshot: {
        receiverName: foundAddress.receiverName,
        phoneNumber: foundAddress.phoneNumber,
        houseBuilding: foundAddress.houseBuilding,
        subAddressArea: foundAddress.subAddressArea,
        city: foundAddress.city,
        state: foundAddress.state,
        pincode: foundAddress.pincode,
        landmark: foundAddress.landmark || ''
      },
      totalAmount,
      deliveryCharge,
      appliedCartOfferName: cartOfferDetails.appliedCartOfferName || null,
      cartDiscountAmount: cartOfferDetails.cartDiscountAmount || 0,
      orderStatus: 'placed',
      paymentStatus: paymentDetails.status === 'success' ? 'paid' : 'pending'
    });

    // 8. Create OrderItems
    const orderItemsToCreate = validatedItems.map((valItem) => ({
      orderId: order._id,
      variantId: valItem.variant._id,
      productNameSnapshot: valItem.product.productName,
      variantSnapshot: valItem.variant.displayName || `${valItem.variant.weight}${valItem.variant.unit}`,
      quantity: valItem.quantity,
      unitPrice: valItem.unitPrice,
      subtotal: valItem.subtotal,
      appliedOfferName: valItem.appliedOfferName || null
    }));

    const orderItems = await OrderItem.insertMany(orderItemsToCreate);

    // 9. Create Payment document
    const payment = await Payment.create({
      orderId: order._id,
      userId: freshUser._id,
      amount: totalAmount,
      method: paymentDetails.method,
      status: paymentDetails.status,
      transactionId: paymentDetails.transactionId
    });

    // 10. Create Invoice document
    const invoiceNumber = generateInvoiceNumber();
    const invoice = await Invoice.create({
      invoiceNumber,
      orderId: order._id,
      userId: freshUser._id,
      totalAmount,
      invoiceDate: new Date()
    });

    // 11. Clear Cart
    await CartItem.deleteMany({ cartId: cart._id });

    // 12. Return all created documents
    return { order, orderItems, payment, invoice };
  } catch (error) {
    // Compensating rollback: restore reduced stock if any DB creation step failed
    console.error('Error during checkout execution. Rolling back reduced stock...', error);
    for (const reduced of reducedStocks) {
      try {
        await Stock.findByIdAndUpdate(reduced.stockId, {
          $inc: { availableQuantity: reduced.quantity }
        });
      } catch (rollbackErr) {
        console.error('Critical: Failed to restore stock during rollback:', rollbackErr);
      }
    }
    throw error;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Core checkout business logic for COD and (previously) simulated online payments.
 * COD continues to call this function directly — its behavior is unchanged.
 *
 * For online payments (upi/card/netbanking), the frontend should instead call
 * initiateRazorpayOrder + verifyAndCreateOrder (Phase 5D-A two-step flow).
 */
export const createOrderFromCart = async (user, { addressId, paymentMethod }) => {
  // Validate cart and compute total using the shared helper
  const {
    freshUser,
    foundAddress,
    cart,
    validatedItems,
    totalAmount,
    cartDiscountAmount,
    appliedCartOfferName
  } = await validateCartAndComputeTotal(user, { addressId });

  // Build payment details: COD is always "pending", simulated online is "success"
  const paymentDetails = {
    method: paymentMethod,
    status: paymentMethod === 'cod' ? 'pending' : 'success',
    transactionId: `TXN-${Date.now()}` // simulated transaction id for COD / old flow
  };

  return reduceStockAndCreateDocuments(
    freshUser,
    foundAddress,
    cart,
    validatedItems,
    totalAmount,
    paymentDetails,
    { cartDiscountAmount, appliedCartOfferName }
  );
};

/**
 * PHASE 5D-A — STEP 1: Initiate a real Razorpay payment order.
 *
 * This function validates the cart and creates a Razorpay order WITHOUT writing
 * anything to MongoDB. The frontend uses the returned razorpayOrderId to open the
 * Razorpay checkout popup and collect payment details from the customer.
 *
 * Stock is NOT reduced here. Order/Payment/Invoice documents are NOT created here.
 * Everything happens only after signature verification in verifyAndCreateOrder.
 *
 * @param {object} user       - Authenticated user (req.user)
 * @param {object} params     - { addressId }
 * @returns {{ razorpayOrderId, amount, currency, addressId }}
 */
export const initiateRazorpayOrder = async (user, { addressId }) => {
  // Validate cart and compute total (no stock reduction, no DB writes)
  const { totalAmount } = await validateCartAndComputeTotal(user, { addressId });

  // Create a Razorpay order on Razorpay's servers.
  // amount is in paise (1 INR = 100 paise), so multiply by 100.
  // receipt is a short unique string we send to Razorpay for our own reference.
  const receipt = `rcpt_${Date.now()}`;

  const razorpayOrder = await razorpay.orders.create({
    amount: Math.round(totalAmount * 100), // paise
    currency: 'INR',
    receipt,
  });

  // Return everything the frontend needs to open the Razorpay checkout widget.
  // We do NOT persist anything to our MongoDB at this point.
  return {
    razorpayOrderId: razorpayOrder.id,
    amount: totalAmount,       // in rupees (for display), not paise
    currency: 'INR',
    addressId,                 // pass back so the frontend includes it in the verify call
  };
};

/**
 * PHASE 5D-A — STEP 2: Verify Razorpay payment signature, then create the order.
 *
 * This is called AFTER the customer completes payment in the Razorpay popup.
 * Razorpay sends razorpay_order_id, razorpay_payment_id, and razorpay_signature
 * back to the frontend, which forwards them here.
 *
 * ─── WHY WE VERIFY ON THE BACKEND WITH THE SECRET KEY ───────────────────────
 * Razorpay generates a signature = HMAC-SHA256(order_id + "|" + payment_id, SECRET).
 * Only Razorpay and our server know the secret key, so only a genuine Razorpay
 * payment can produce a matching signature. If we skipped this check and trusted
 * the frontend's claim that payment succeeded, any malicious user could send a
 * fake razorpay_payment_id and get an order for free. The signature check is the
 * single source of truth that payment was real and not forged.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * @param {object} user   - Authenticated user (req.user)
 * @param {object} params - { addressId, razorpay_order_id, razorpay_payment_id, razorpay_signature }
 * @returns {{ order, orderItems, payment, invoice }} — same shape as createOrderFromCart
 */
export const verifyAndCreateOrder = async (
  user,
  { addressId, razorpay_order_id, razorpay_payment_id, razorpay_signature }
) => {
  // ── Signature verification ────────────────────────────────────────────────
  // Razorpay's specification: signature = HMAC-SHA256(order_id + "|" + payment_id, key_secret)
  // We compute it ourselves using the secret key (which never leaves the server)
  // and compare with what Razorpay sent. If they match, the payment is genuine.
  const expectedSignature = crypto
    .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    // Signatures do not match — this payment was tampered with or is fake.
    // Never create an order in this case.
    const err = new Error('Payment verification failed. Invalid payment signature.');
    err.status = 400;
    throw err;
  }
  // ── End signature verification ────────────────────────────────────────────

  // Re-validate cart and stock at this point.
  // IMPORTANT TRADE-OFF (known edge case in real e-commerce):
  // There is a window between the time the customer initiated payment (step 1)
  // and now (step 2) during which another customer could buy the last unit.
  // If that happened, we must NOT silently mark the payment as lost — instead we
  // throw an error asking the customer to contact support so a manual refund can
  // be processed. Building automatic refund automation is outside the scope of
  // this college project, but in a production system you would call Razorpay's
  // refund API here: razorpay.payments.refund(razorpay_payment_id, { amount }).
  const {
    freshUser,
    foundAddress,
    cart,
    validatedItems,
    totalAmount,
    cartDiscountAmount,
    appliedCartOfferName
  } = await validateCartAndComputeTotal(user, { addressId }).catch((stockErr) => {
      // Enhance the error message so the customer knows to contact support
      if (stockErr.message && stockErr.message.includes('Insufficient stock')) {
        stockErr.message =
          `${stockErr.message}. ` +
          'Your Razorpay payment was captured but stock ran out before your order could be confirmed. ' +
          'Please contact support with your payment ID: ' + razorpay_payment_id +
          ' and we will process a refund for you.';
      }
      throw stockErr;
    });

  // Build payment details using the REAL Razorpay payment ID.
  // We use "online" as a generic method since determining the exact sub-method
  // (upi/card/netbanking) would require an extra Razorpay API call (fetch payment
  // by id) which is unnecessary overhead for this phase.
  const paymentDetails = {
    method: 'online',   // generic; Phase 5D-B can enrich this if needed
    status: 'success',  // signature verified → payment is real
    transactionId: razorpay_payment_id // the real Razorpay payment ID, not a fake TXN-timestamp
  };

  return reduceStockAndCreateDocuments(
    freshUser,
    foundAddress,
    cart,
    validatedItems,
    totalAmount,
    paymentDetails,
    { cartDiscountAmount, appliedCartOfferName }
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// OTHER EXPORTS (unchanged from previous phases)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Helper to fetch complete order details with OrderItems, Payment, and Invoice,
 * enforcing ownership/role security check.
 */
export const getOrderFullDetails = async (orderId, requestingUser) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    const err = new Error('Order not found.');
    err.status = 404;
    throw err;
  }

  const order = await Order.findById(orderId).lean();
  if (!order) {
    const err = new Error('Order not found.');
    err.status = 404;
    throw err;
  }

  // Security check: only the order's owner or an admin can access full details
  const isOwner = order.userId.toString() === requestingUser._id.toString();
  const isAdmin = requestingUser.role === 'admin';

  if (!isOwner && !isAdmin) {
    const err = new Error('Access denied.');
    err.status = 403;
    throw err;
  }

  const [orderItems, payment, invoice] = await Promise.all([
    OrderItem.find({ orderId: order._id }).lean(),
    Payment.findOne({ orderId: order._id }).lean(),
    Invoice.findOne({ orderId: order._id }).lean()
  ]);

  return {
    order,
    orderItems: orderItems || [],
    payment: payment || null,
    invoice: invoice || null
  };
};


