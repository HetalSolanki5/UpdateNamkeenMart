import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  variantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Variant' },
  productNameSnapshot: { type: String },
  variantSnapshot: { type: String },
  quantity: { type: Number },
  unitPrice: { type: Number },
  subtotal: { type: Number },
  appliedOfferName: { type: String, default: null }
});

export default mongoose.model('OrderItem', orderItemSchema);
