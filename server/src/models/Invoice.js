import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, unique: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  totalAmount: { type: Number },
  invoiceDate: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Invoice', invoiceSchema);
