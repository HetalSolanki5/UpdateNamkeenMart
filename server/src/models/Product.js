import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
  productName: { type: String, required: true, index: true },
  description: { type: String },
  ingredients: { type: String },
  nutritionalInformation: { type: String },
  productImages: [{ type: String }],
  productRange: {
    type: String,
    enum: ['regular', 'diet'],
    required: true,
    default: 'regular',
    index: true
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Product', productSchema);
