import mongoose from 'mongoose';

const stockSchema = new mongoose.Schema({
  variantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Variant', required: true, unique: true },
  availableQuantity: { type: Number, default: 0 },
  reservedQuantity: { type: Number, default: 0 },
  lowStockThreshold: { type: Number, default: 10 },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Stock', stockSchema);
