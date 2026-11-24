import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  amount: { type: Number },
  method: { type: String, enum: ['upi', 'card', 'netbanking', 'cod', 'online'] },
  transactionId: { type: String },
  status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' }
}, { timestamps: true });

export default mongoose.model('Payment', paymentSchema);
