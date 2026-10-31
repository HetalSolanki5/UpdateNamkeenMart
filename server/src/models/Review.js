import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rating: { type: Number, min: 1, max: 5 },
  comment: { type: String },
  isApproved: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Review', reviewSchema);
