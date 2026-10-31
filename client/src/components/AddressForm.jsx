import React, { useState, useEffect } from 'react';

const AddressForm = ({ initialValues, onSubmit, onCancel, submitting = false }) => {
  const [formData, setFormData] = useState({
    receiverName: '',
    phoneNumber: '',
    houseBuilding: '',
    subAddressArea: '',
    landmark: '',
    city: '',
    state: 'Gujarat',
    pincode: '',
    isDefault: false
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialValues) {
      setFormData({
        receiverName: initialValues.receiverName || '',
        phoneNumber: initialValues.phoneNumber || '',
        houseBuilding: initialValues.houseBuilding || '',
        subAddressArea: initialValues.subAddressArea || '',
        landmark: initialValues.landmark || '',
        city: initialValues.city || '',
        state: initialValues.state || 'Gujarat',
        pincode: initialValues.pincode || '',
        isDefault: Boolean(initialValues.isDefault)
      });
    }
  }, [initialValues]);

  const validate = () => {
    const newErrors = {};

    if (!formData.receiverName.trim()) {
      newErrors.receiverName = 'Receiver name is required.';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required.';
    } else if (!/^\d{10}$/.test(formData.phoneNumber.trim())) {
      newErrors.phoneNumber = 'Phone number must be a 10-digit number.';
    }

    if (!formData.houseBuilding.trim()) {
      newErrors.houseBuilding = 'Flat / House / Building is required.';
    }

    if (!formData.subAddressArea.trim()) {
      newErrors.subAddressArea = 'Area / Sector / Locality is required.';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required.';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required.';
    }

    if (!formData.pincode.trim()) {
      newErrors.pincode = 'Pincode is required.';
    } else if (!/^\d{6}$/.test(formData.pincode.trim())) {
      newErrors.pincode = 'Pincode must be exactly 6 digits.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error on change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
      <h3 className="text-base font-bold text-gray-800 pb-2 border-b border-gray-100">
        {initialValues ? 'Edit Delivery Address' : 'Add New Delivery Address'}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Receiver Name */}
        <div>
          <label className="text-xs font-semibold text-gray-700 block mb-1">
            Receiver Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="receiverName"
            value={formData.receiverName}
            onChange={handleChange}
            placeholder="e.g. Ramesh Patel"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#C62828]"
          />
          {errors.receiverName && (
            <p className="text-xs text-red-600 mt-1">{errors.receiverName}</p>
          )}
        </div>

        {/* Phone Number */}
        <div>
          <label className="text-xs font-semibold text-gray-700 block mb-1">
            10-digit Mobile Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            name="phoneNumber"
            maxLength={10}
            value={formData.phoneNumber}
            onChange={handleChange}
            placeholder="e.g. 9876543210"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#C62828]"
          />
          {errors.phoneNumber && (
            <p className="text-xs text-red-600 mt-1">{errors.phoneNumber}</p>
          )}
        </div>
      </div>

      {/* House/Building */}
      <div>
        <label className="text-xs font-semibold text-gray-700 block mb-1">
          Flat, House No., Building, Company, Apartment <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="houseBuilding"
          value={formData.houseBuilding}
          onChange={handleChange}
          placeholder="e.g. B-102, Shivalik Residency"
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#C62828]"
        />
        {errors.houseBuilding && (
          <p className="text-xs text-red-600 mt-1">{errors.houseBuilding}</p>
        )}
      </div>

      {/* Sub Address / Area */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-gray-700 block mb-1">
            Area, Street, Sector, Village <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="subAddressArea"
            value={formData.subAddressArea}
            onChange={handleChange}
            placeholder="e.g. Bodakdev"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#C62828]"
          />
          {errors.subAddressArea && (
            <p className="text-xs text-red-600 mt-1">{errors.subAddressArea}</p>
          )}
        </div>

        {/* Landmark */}
        <div>
          <label className="text-xs font-semibold text-gray-700 block mb-1">
            Landmark <span className="text-gray-400 font-normal">(Optional)</span>
          </label>
          <input
            type="text"
            name="landmark"
            value={formData.landmark}
            onChange={handleChange}
            placeholder="e.g. Near Rajpath Club"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#C62828]"
          />
        </div>
      </div>

      {/* City, State, Pincode */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-semibold text-gray-700 block mb-1">
            Town / City <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            placeholder="e.g. Ahmedabad"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#C62828]"
          />
          {errors.city && (
            <p className="text-xs text-red-600 mt-1">{errors.city}</p>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-700 block mb-1">
            State <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="state"
            value={formData.state}
            onChange={handleChange}
            placeholder="e.g. Gujarat"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#C62828]"
          />
          {errors.state && (
            <p className="text-xs text-red-600 mt-1">{errors.state}</p>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-700 block mb-1">
            6-digit Pincode <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="pincode"
            maxLength={6}
            value={formData.pincode}
            onChange={handleChange}
            placeholder="e.g. 380054"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#C62828]"
          />
          {errors.pincode && (
            <p className="text-xs text-red-600 mt-1">{errors.pincode}</p>
          )}
        </div>
      </div>

      {/* Default Checkbox */}
      <div className="pt-2">
        <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            name="isDefault"
            checked={formData.isDefault}
            onChange={handleChange}
            className="rounded text-[#C62828] focus:ring-[#C62828]"
          />
          <span>Set as default delivery address</span>
        </label>
      </div>

      {/* Action Buttons */}
      <div className="pt-4 flex items-center justify-end space-x-3 border-t border-gray-100">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2 text-xs font-bold text-white bg-[#C62828] hover:bg-[#8E1B1B] rounded-lg transition shadow-sm disabled:opacity-50"
        >
          {submitting ? 'Saving...' : initialValues ? 'Save Changes' : 'Save Address'}
        </button>
      </div>
    </form>
  );
};

export default AddressForm;
