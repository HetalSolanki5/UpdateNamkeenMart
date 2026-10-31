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
