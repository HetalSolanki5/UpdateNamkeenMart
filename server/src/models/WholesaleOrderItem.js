import mongoose from 'mongoose';

const wholesaleOrderItemSchema = new mongoose.Schema({
  wholesaleOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'WholesaleOrder' },
  variantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Variant' },
  productNameSnapshot: { type: String },
  quantity: { type: Number },
  wholesaleUnitPrice: { type: Number },
  subtotal: { type: Number }
});

export default mongoose.model('WholesaleOrderItem', wholesaleOrderItemSchema);
