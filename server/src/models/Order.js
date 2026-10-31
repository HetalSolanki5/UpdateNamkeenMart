import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  customerSnapshot: {
    name: { type: String },
    phone: { type: String },
    email: { type: String }
  },
  deliveryAddressSnapshot: {
    receiverName: String,
    phoneNumber: String,
    houseBuilding: String,
    subAddressArea: String,
    city: String,
    state: String,
    pincode: String,
    landmark: String
  },
  totalAmount: { type: Number },
  deliveryCharge: { type: Number, default: 0 },
  orderStatus: {
    type: String,
    enum: ['placed', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'placed'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  }
}, { timestamps: true });

orderSchema.index({ createdAt: 1 });

export default mongoose.model('Order', orderSchema);
