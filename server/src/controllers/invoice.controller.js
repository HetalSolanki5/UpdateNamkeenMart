import { Invoice } from '../models/index.js';
import { getOrderFullDetails } from '../services/order.service.js';
import { invoiceHtml } from '../templates/invoice.template.js';
import { htmlToPdfBuffer } from '../utils/pdfGenerator.js';

/**
 * Internal helper to load full order details and shape the data object
 * for invoice rendering.
 */
export const getInvoiceData = async (orderId, user) => {
  const { order, orderItems, payment, invoice } = await getOrderFullDetails(orderId, user);

  const addr = order.deliveryAddressSnapshot || {};
  const formattedAddress = [
    addr.houseBuilding,
    addr.subAddressArea,
    addr.landmark,
    addr.city,
    addr.state,
    addr.pincode
  ]
    .filter(Boolean)
    .join(', ');

  return {
    invoiceId: invoice?._id,
    invoiceNumber: invoice ? invoice.invoiceNumber : `RN-INV-${order.orderNumber}`,
    orderId: order._id,
    orderNumber: order.orderNumber,
    invoiceDate: invoice ? invoice.invoiceDate : order.createdAt,
    // Phase 12C: "Billed By" seller details and "Shipped To" delivery address
    billedBy: {
      name: 'Rameshwar Namkeen',
      tagline: 'Authentic Taste of Gujarat',
      address: 'Plot No. 12, GIDC Industrial Estate, Rajkot, Gujarat - 360003',
      phone: '+91 98765 43210',
      email: 'sales@ramshewarnamkeen.com',
      gstin: '24AAACR1234M1Z5'
    },
    shippedTo: {
      receiverName: addr.receiverName || order.customerSnapshot?.name || user.name || 'Valued Customer',
      phone: addr.phoneNumber || order.customerSnapshot?.phone || user.phone || 'N/A',
      address: formattedAddress || 'Address on file'
    },
    // Retain top-level address/phone/customerName for backwards compatibility if needed
    customerName: addr.receiverName || order.customerSnapshot?.name || user.name,
    phone: addr.phoneNumber || order.customerSnapshot?.phone || user.phone,
    address: formattedAddress || 'Address on file',
    items: (orderItems || []).map((it) => ({
      productName: it.productNameSnapshot || 'Namkeen Item',
      variant: it.variantSnapshot || 'Standard Pack',
      quantity: it.quantity || 1,
      unitPrice: it.unitPrice || 0,
      subtotal: it.subtotal || 0,
      appliedOfferName: it.appliedOfferName || null
    })),
    deliveryCharge: order.deliveryCharge || 0,
    appliedCartOfferName: order.appliedCartOfferName || null,
    cartDiscountAmount: order.cartDiscountAmount || 0,
    totalAmount: order.totalAmount || 0,
    paymentMethod: payment ? payment.method : 'N/A',
    paymentStatus: payment ? payment.status : order.paymentStatus
  };
};

// @desc    Get invoice details as JSON (for web preview)
// @route   GET /api/invoices/:orderId
// @access  Private (Customer only)
export const getInvoiceJson = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const invoiceData = await getInvoiceData(orderId, req.user);
    return res.status(200).json({ invoice: invoiceData });
  } catch (error) {
    return res.status(error.status || 500).json({
      message: error.message || 'Internal Server Error'
    });
  }
};

// @desc    Download invoice as PDF
// @route   GET /api/invoices/:orderId/pdf
// @access  Private (Customer only)
export const downloadInvoicePdf = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const invoiceData = await getInvoiceData(orderId, req.user);

    // Build HTML string from template
    const html = invoiceHtml(invoiceData);

    // Convert HTML to PDF buffer
    const pdfBuffer = await htmlToPdfBuffer(html);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="invoice-${invoiceData.invoiceNumber}.pdf"`
    );

    return res.send(pdfBuffer);
  } catch (error) {
    return res.status(error.status || 500).json({
      message: error.message || 'Internal Server Error'
    });
  }
};

// @desc    Get all invoices for logged-in customer
// @route   GET /api/invoices
// @access  Private (Customer only)
export const getMyInvoices = async (req, res, next) => {
  try {
    const invoices = await Invoice.find({ userId: req.user._id })
      .populate('orderId', 'orderNumber orderStatus totalAmount')
      .sort({ invoiceDate: -1 })
      .lean();

    const formattedInvoices = invoices.map((inv) => ({
      _id: inv._id,
      invoiceNumber: inv.invoiceNumber,
      invoiceDate: inv.invoiceDate,
      totalAmount: inv.totalAmount,
      order: inv.orderId
        ? {
            _id: inv.orderId._id,
            orderNumber: inv.orderId.orderNumber,
            orderStatus: inv.orderId.orderStatus
          }
        : null
    }));

    return res.status(200).json({
      invoices: formattedInvoices
    });
  } catch (error) {
    next(error);
  }
};
