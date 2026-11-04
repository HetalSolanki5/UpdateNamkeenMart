
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const registerUser = async (data, requestedRole = 'customer') => {
  const { name, email, phone, password } = data;

  if (!name || !email || !phone || !password) {
    throw new Error('Name, email, phone and password are required new error');
  }

  if (typeof password !== 'string' || password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  if (!['customer', 'wholesaler'].includes(requestedRole)) {
    throw new Error('Invalid registration role');
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await User.findOne({
    email: normalizedEmail
  });

  if (existingUser) {
    throw new Error('Email is already registered');
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    phone: phone.trim(),
    password: hashedPassword,
    role: requestedRole,
    houseBuilding: data.houseBuilding,
    subAddressArea: data.subAddressArea,
    city: data.city,
    state: data.state,
    pincode: data.pincode
  });

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role
  };
};

export const loginUser = async ({ email, password, role }) => {
  if (!email || !password || !role) {
    throw new Error('Email, password and role are required');
  }

  if (!['customer', 'wholesaler', 'admin'].includes(role)) {
    throw new Error('Invalid role');
  }

  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  const user = await User.findOne({
    email: email.trim().toLowerCase()
  }).select('+password');

  if (!user) {
    throw new Error('Invalid email, password or role');
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.password
  );

  if (!passwordMatches || user.role !== role) {
    throw new Error('Invalid email, password or role');
  }

  const token = jwt.sign(
    {
      userId: user._id.toString(),
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role
    }
  };
};

export const getUserById = async (userId) => {
  const user = await User.findById(userId).select('-password');

  if (!user) {
    throw new Error('User not found');
  }

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role
  };
};
