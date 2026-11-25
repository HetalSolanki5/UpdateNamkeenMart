import { User } from '../models/index.js';
import generateToken from '../utils/generateToken.js';

export const registerCustomer = async (req, res, next) => {
  try {
    const { name, email, phone, password, address } = req.body;

    // Check for existing user
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    // Always force role to customer
    const newUserData = {
      name,
      email,
      phone,
      password,
      role: 'customer' 
    };

    if (address) {
      newUserData.addresses = [{ ...address, isDefault: true }];
    }

    const user = await User.create(newUserData);
    const token = generateToken(user);

    return res.status(201).json({ message: 'Registration successful', token, user });
  } catch (error) {
    next(error);
  }
};

export const registerWholesaler = async (req, res, next) => {
  try {
    const { name, email, phone, password, address, businessName, gstNumber } = req.body;

    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const newUserData = {
      name,
      email,
      phone,
      password,
      role: 'wholesaler',
      wholesalerStatus: 'pending',
      businessName,
      gstNumber
    };

    if (address) {
      newUserData.addresses = [{ ...address, isDefault: true }];
    }

    const user = await User.create(newUserData);

    // No token returned here as they wait for admin approval
    return res.status(201).json({ 
      message: 'Your wholesaler account is waiting for admin approval.', 
      user 
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    // Must fetch password manually since we set select: false in model
    const user = await User.findOne({ email }).select('+password');
    
    // Check if user exists and password is correct
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if requested role matches their account
    if (user.role !== role) {
      return res.status(403).json({ message: 'Wrong role selected for this account' });
    }

    // Verify account is active
    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is inactive. Contact admin.' });
    }

    const token = generateToken(user);

    return res.status(200).json({ message: 'Login successful', token, user });
  } catch (error) {
    next(error);
  }
};

export const logout = (req, res) => {
  return res.status(200).json({ message: 'Logged out. Please delete the token on the client.' });
};

export const getMe = (req, res) => {
  return res.status(200).json({ user: req.user });
};

// --- FORGOT PASSWORD FLOW (OTP BASED) ---

export const forgotPassword = async (req, res, next) => {
  try {
    const { email, role } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const query = { email: email.trim().toLowerCase() };
    if (role) {
      query.role = role;
    }

    const user = await User.findOne(query);
    if (!user) {
      return res.status(404).json({ message: 'User not found with this email and role' });
    }

    // Generate 6 digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes valid

    user.resetPasswordOTP = otp;
    user.resetPasswordExpires = expiresAt;
    await user.save();

    console.log(`\n========================================`);
    console.log(`🔑 PASSWORD RESET OTP for ${user.email} (${user.role}): [ ${otp} ]`);
    console.log(`Valid for 10 minutes (expires at: ${expiresAt.toLocaleTimeString()})`);
    console.log(`========================================\n`);

    return res.status(200).json({
      success: true,
      message: 'OTP generated and sent successfully. Please check your console.'
    });
  } catch (error) {
    next(error);
  }
};

export const verifyResetOTP = async (req, res, next) => {
  try {
    const { email, otp, role } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const query = { email: email.trim().toLowerCase() };
    if (role) query.role = role;

    const user = await User.findOne(query).select('+resetPasswordOTP +resetPasswordExpires');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.resetPasswordOTP || user.resetPasswordOTP !== otp.trim()) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword, role } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP, and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    const query = { email: email.trim().toLowerCase() };
    if (role) query.role = role;

    const user = await User.findOne(query).select('+password +resetPasswordOTP +resetPasswordExpires');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.resetPasswordOTP || user.resetPasswordOTP !== otp.trim()) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    user.password = newPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.'
    });
  } catch (error) {
    next(error);
  }
};

// TEST ROUTE - remove later
export const customerOnly = (req, res) => {
  return res.json({ message: 'Welcome customer' });
};

// TEST ROUTE - remove later
export const wholesalerOnly = (req, res) => {
  return res.json({ message: 'Welcome wholesaler' });
};

// TEST ROUTE - remove later
export const adminOnly = (req, res) => {
  return res.json({ message: 'Welcome admin' });
};

