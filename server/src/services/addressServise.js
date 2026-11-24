
import User from '../models/User.js';

// Add new address
export const addAddress = async (userId, addressData) => {
    const {
        receiverName,
        phoneNumber,
        houseBuilding,
        subAddressArea,
        landmark,
        city,
        state,
        pincode,
        isDefault
    } = addressData;

    if (
        !receiverName ||
        !phoneNumber ||
        !houseBuilding ||
        !subAddressArea ||
        !city ||
        !state ||
        !pincode
    ) {
        throw new Error('Please fill all required address fields');
    }

    const user = await User.findById(userId);

    if (!user) {
        throw new Error('User not found');
    }

    // If first address, make it default
    const makeDefault = isDefault === true || user.addresses.length === 0;

    if (makeDefault) {
        user.addresses.forEach((address) => {
            address.isDefault = false;
        });
    }

    const newAddress = {
        receiverName,
        phoneNumber,
        houseBuilding,
        subAddressArea,
        landmark,
        city,
        state,
        pincode,
        isDefault: makeDefault
    };

    user.addresses.push(newAddress);

    await user.save();

    return user.addresses[user.addresses.length - 1];
};


// Get all addresses
export const getAllAddresses = async (userId) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new Error('User not found');
    }

    return user.addresses;
};


// Get address by ID
export const getAddressById = async (userId, addressId) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new Error('User not found');
    }

    const address = user.addresses.id(addressId);

    if (!address) {
        throw new Error('Address not found');
    }

    return address;
};


// Update address
export const updateAddress = async (
    userId,
    addressId,
    updateData
) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new Error('User not found');
    }

    const address = user.addresses.id(addressId);

    if (!address) {
        throw new Error('Address not found');
    }

    const allowedFields = [
        'receiverName',
        'phoneNumber',
        'houseBuilding',
        'subAddressArea',
        'landmark',
        'city',
        'state',
        'pincode'
    ];

    allowedFields.forEach((field) => {
        if (updateData[field] !== undefined) {
            address[field] = updateData[field];
        }
    });

    if (updateData.isDefault === true) {
        user.addresses.forEach((item) => {
            item.isDefault = false;
        });

        address.isDefault = true;
    }

    await user.save();

    return address;
};


// Delete address
export const deleteAddress = async (userId, addressId) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new Error('User not found');
    }

    const address = user.addresses.id(addressId);

    if (!address) {
        throw new Error('Address not found');
    }

    const wasDefault = address.isDefault;

    user.addresses.pull({ _id: addressId });

    // Assign default to another address if needed
    if (wasDefault && user.addresses.length > 0) {
        user.addresses[0].isDefault = true;
    }

    await user.save();

    return {
        message: 'Address deleted successfully'
    };
};


// Set default address
export const setDefaultAddress = async (userId, addressId) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new Error('User not found');
    }

    const address = user.addresses.id(addressId);

    if (!address) {
        throw new Error('Address not found');
    }

    user.addresses.forEach((item) => {
        item.isDefault = false;
    });

    address.isDefault = true;

    await user.save();

    return address;
};


const addressService = {
    addAddress,
    getAllAddresses,
    getAddressById,
    updateAddress,
    deleteAddress,
    setDefaultAddress
};

export default addressService;
