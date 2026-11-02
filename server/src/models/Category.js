import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  categoryName: { type: String, required: true, unique: true },
  description: { type: String },
  image: { type: String, default: 'c:\Users\solan\Downloads\Golden Sev in a White Bowl.png' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Category', categorySchema);
