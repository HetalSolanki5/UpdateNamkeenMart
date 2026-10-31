// @desc    Manage customer delivery addresses (embedded subdocuments in User)
import { User } from '../models/index.js';

// @desc    Get all addresses for logged-in user
// @route   GET /api/users/addresses
// @access  Private (Customer only)
export const getAddresses = async (req, res, next) => {
  try {
    return res.status(200).json({
      addresses: req.user.addresses || []
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
    const {
      receiverName,
      phoneNumber,
      houseBuilding,
      subAddressArea,
      city,
      state,
      pincode,
      landmark,
      isDefault
    } = req.body;

    // Validate required fields
    if (
      !receiverName ||
      !phoneNumber ||
      !houseBuilding ||
      !subAddressArea ||
      !city ||
      !state ||
      !pincode
    ) {
      return res.status(400).json({
        message: 'All address fields (receiverName, phoneNumber, houseBuilding, subAddressArea, city, state, pincode) are required.'
      });
    }

    // Validate 6-digit numeric pincode
    if (!/^\d{6}$/.test(pincode.toString().trim())) {
      return res.status(400).json({ message: 'Pincode must be exactly 6 digits.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // If this is the user's first address, force isDefault = true regardless of input
    let makeDefault = Boolean(isDefault);
    if (user.addresses.length === 0) {
      makeDefault = true;
    }

    // If making this default, reset isDefault on all other existing addresses
    if (makeDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    user.addresses.push({
      receiverName: receiverName.trim(),
      phoneNumber: phoneNumber.trim(),
      houseBuilding: houseBuilding.trim(),
      subAddressArea: subAddressArea.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.toString().trim(),
      landmark: landmark ? landmark.trim() : '',
      isDefault: makeDefault
    });

    await user.save();

    return res.status(201).json({
      message: 'Address added successfully',
      addresses: user.addresses
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an existing delivery address
// @route   PUT /api/users/addresses/:addressId
// @access  Private (Customer only)
export const updateAddress = async (req, res, next) => {
  try {
    const { addressId } = req.params;
    const {
      receiverName,
      phoneNumber,
      houseBuilding,
      subAddressArea,
      city,
      state,
      pincode,
      landmark,
      isDefault
    } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({ message: 'Address not found.' });
    }

    if (pincode && !/^\d{6}$/.test(pincode.toString().trim())) {
      return res.status(400).json({ message: 'Pincode must be exactly 6 digits.' });
    }

    if (receiverName !== undefined) address.receiverName = receiverName.trim();
    if (phoneNumber !== undefined) address.phoneNumber = phoneNumber.trim();
    if (houseBuilding !== undefined) address.houseBuilding = houseBuilding.trim();
    if (subAddressArea !== undefined) address.subAddressArea = subAddressArea.trim();
    if (city !== undefined) address.city = city.trim();
    if (state !== undefined) address.state = state.trim();
    if (pincode !== undefined) address.pincode = pincode.toString().trim();
    if (landmark !== undefined) address.landmark = landmark ? landmark.trim() : '';

    // If updating isDefault to true, clear isDefault on all others
    if (isDefault === true) {
      user.addresses.forEach((addr) => {
        if (addr._id.toString() !== addressId) {
          addr.isDefault = false;
        }
      });
      address.isDefault = true;
    }

    // Ensure at least one address is marked default if addresses exist
    const hasDefault = user.addresses.some((addr) => addr.isDefault);
    if (!hasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    return res.status(200).json({
      message: 'Address updated successfully',
      addresses: user.addresses
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a delivery address
// @route   DELETE /api/users/addresses/:addressId
// @access  Private (Customer only)
export const deleteAddress = async (req, res, next) => {
  try {
    const { addressId } = req.params;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({ message: 'Address not found.' });
    }

    const wasDefault = address.isDefault;
    user.addresses.pull(addressId);

    // If the deleted one was default and other addresses remain, set the first remaining one as default
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    return res.status(200).json({
      message: 'Address deleted successfully',
      addresses: user.addresses
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Set an address as default
// @route   PUT /api/users/addresses/:addressId/default
// @access  Private (Customer only)
export const setDefaultAddress = async (req, res, next) => {
  try {
    const { addressId } = req.params;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const target = user.addresses.id(addressId);
    if (!target) {
      return res.status(404).json({ message: 'Address not found.' });
    }

    // Set this one as default, all others false
    user.addresses.forEach((addr) => {
      addr.isDefault = addr._id.toString() === addressId;
    });

    await user.save();

    return res.status(200).json({
      message: 'Default address updated successfully',
      addresses: user.addresses
    });
  } catch (error) {
    next(error);
  }
};
