import mongoose from 'mongoose';

const wholesaleOrderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  wholesalerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  totalAmount: { type: Number },
  deliveryCharge: { type: Number, default: 0 },
  orderStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  }
}, { timestamps: true });

export default mongoose.model('WholesaleOrder', wholesaleOrderSchema);
