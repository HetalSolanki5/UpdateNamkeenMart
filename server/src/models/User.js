
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      select: false
    },
    role: {
      type: String,
      enum: ['customer', 'wholesaler', 'admin'],
      default: 'customer',
      required: true
    },
    houseBuilding: String,
    subAddressArea: String,
    city: String,
    state: String,
    pincode: String
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

export default User;
