import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const addressSchema = new mongoose.Schema({
  receiverName: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  houseBuilding: { type: String, required: true },
  subAddressArea: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  landmark: { type: String },
  isDefault: { type: Boolean, default: false }
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  phone: { type: String, required: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['admin', 'customer', 'wholesaler'], default: 'customer' },
  businessName: { type: String },
  gstNumber: { type: String },
  wholesalerStatus: { type: String, enum: ['pending', 'approved', 'rejected', 'inactive'], default: 'pending' },
  isActive: { type: Boolean, default: true },
  addresses: [addressSchema]
}, { timestamps: true });

// Hash password before saving if modified
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password instance method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Transform toJSON to remove password and __v
userSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    delete ret.password;
    delete ret.__v;
    return ret;
  }
});

export default mongoose.model('User', userSchema);
