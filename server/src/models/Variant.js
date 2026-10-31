import mongoose from 'mongoose';

const variantSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  weight: { type: Number, required: true },
  unit: { type: String, enum: ['g', 'kg'], default: 'g' },
  displayName: { type: String },
  sellingPrice: { type: Number, required: true },
  wholesalePrice: { type: Number, required: true },
  sku: { type: String, required: true, unique: true, index: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Variant', variantSchema);
