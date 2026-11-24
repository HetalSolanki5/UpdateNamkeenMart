// @desc    Manage customer delivery addresses (embedded subdocuments in User)
import { User } from '../models/index.js';
import * as addressService from '../services/addressServise.js';

// @desc    Get all addresses for logged-in user
// @route   GET /api/users/addresses
// @access  Private (Customer only)
export const getAddresses = async (req, res, next) => {
  try {
    const addresses = await addressService.getAllAddresses(req.user._id);
    return res.status(200).json({
      addresses: addresses || []
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a new delivery address
// @route   POST /api/users/addresses
// @access  Private (Customer only)
export const addAddress = async (req, res, next) => {
  try {
    await addressService.addAddress(req.user._id, req.body);
    const updatedUser = await User.findById(req.user._id);
    return res.status(201).json({
      message: 'Address added successfully',
      addresses: updatedUser.addresses
    });
  } catch (error) {
    if (error.message && error.message.includes('required')) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};

// @desc    Update an existing delivery address
// @route   PUT /api/users/addresses/:addressId
// @access  Private (Customer only)
export const updateAddress = async (req, res, next) => {
  try {
    const { addressId } = req.params;
    await addressService.updateAddress(req.user._id, addressId, req.body);
    const updatedUser = await User.findById(req.user._id);
    return res.status(200).json({
      message: 'Address updated successfully',
      addresses: updatedUser.addresses
    });
  } catch (error) {
    if (error.message && error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
};

// @desc    Delete a delivery address
// @route   DELETE /api/users/addresses/:addressId
// @access  Private (Customer only)
export const deleteAddress = async (req, res, next) => {
  try {
    const { addressId } = req.params;
    await addressService.deleteAddress(req.user._id, addressId);
    const updatedUser = await User.findById(req.user._id);
    return res.status(200).json({
      message: 'Address deleted successfully',
      addresses: updatedUser.addresses
    });
  } catch (error) {
    if (error.message && error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
};

// @desc    Set an address as default
// @route   PUT /api/users/addresses/:addressId/default
// @access  Private (Customer only)
export const setDefaultAddress = async (req, res, next) => {
  try {
    const { addressId } = req.params;
    await addressService.setDefaultAddress(req.user._id, addressId);
    const updatedUser = await User.findById(req.user._id);
    return res.status(200).json({
      message: 'Default address updated successfully',
      addresses: updatedUser.addresses
    });
  } catch (error) {
    if (error.message && error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
};
