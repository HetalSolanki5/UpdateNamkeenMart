
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const addressSchema = new mongoose.Schema(
  {
    houseBuilding: { type: String, trim: true },
    subAddressArea: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    pincode: { type: String, trim: true },
    isDefault: { type: Boolean, default: false }
  },
  { _id: true }
);

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
    isActive: {
      type: Boolean,
      default: true
    },
    wholesalerStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: undefined
    },
    businessName: {
      type: String,
      trim: true
    },
    gstNumber: {
      type: String,
      trim: true
    },
    houseBuilding: String,
    subAddressArea: String,
    city: String,
    state: String,
    pincode: String,
    addresses: {
      type: [addressSchema],
      default: []
    },
    resetPasswordOTP: {
      type: String,
      select: false
    },
    resetPasswordExpires: {
      type: Date,
      select: false
    }
  },
  { timestamps: true }
);

userSchema.set('toJSON', {
  transform: (_document, returnedObject) => {
    delete returnedObject.password;
    return returnedObject;
  }
});

userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;

