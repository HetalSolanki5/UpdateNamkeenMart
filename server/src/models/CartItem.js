import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  cartId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cart', required: true },
  variantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Variant', required: true },
  quantity: { type: Number, min: 1, default: 1 }
});

// A cart shouldn't have duplicate variant items; quantity should just increase instead
cartItemSchema.index({ cartId: 1, variantId: 1 }, { unique: true });

export default mongoose.model('CartItem', cartItemSchema);
