import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress
} from '../../api/addressApi.js';
import AddressCard from '../../components/AddressCard.jsx';
import AddressForm from '../../components/AddressForm.jsx';
import Loader from '../../components/Loader.jsx';
import EmptyState from '../../components/EmptyState.jsx';

const AddressesPage = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fetchAddresses = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAddresses();
      setAddresses(data?.addresses || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load addresses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const showToast = (message, type = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => {
      setFeedback(null);
    }, 2500);
  };

  const handleFormSubmit = async (formData) => {
    setSubmitting(true);
    try {
      if (editingAddress) {
        const res = await updateAddress(editingAddress._id, formData);
        setAddresses(res?.addresses || []);
        showToast('Address updated successfully');
      } else {
        const res = await addAddress(formData);
        setAddresses(res?.addresses || []);
        showToast('Address added successfully');
      }
      setShowForm(false);
      setEditingAddress(null);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save address', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (address) => {
    setEditingAddress(address);
    setShowForm(true);
  };

  const handleDelete = async (addressId) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      const res = await deleteAddress(addressId);
      setAddresses(res?.addresses || []);
      showToast('Address deleted');
    } catch (err) {
      showToast('Failed to delete address', 'error');
    }
  };

  const handleSetDefault = async (addressId) => {
    try {
      const res = await setDefaultAddress(addressId);
      setAddresses(res?.addresses || []);
      showToast('Default address updated');
    } catch (err) {
      showToast('Failed to update default address', 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center space-x-2 text-xs text-gray-500 mb-1">
            <Link to="/customer" className="hover:text-[#C62828]">&larr; Account Dashboard</Link>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Saved Delivery Addresses
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage your delivery destinations for quick and easy checkout.
          </p>
        </div>

        {!showForm && (
          <button
            onClick={() => {
              setEditingAddress(null);
              setShowForm(true);
            }}
            className="px-4 py-2 bg-[#C62828] hover:bg-[#8E1B1B] text-white text-xs font-bold rounded-xl transition shadow-xs self-start sm:self-auto"
          >
            + Add New Address
          </button>
        )}
      </div>

      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-3 rounded-lg text-xs font-semibold text-center transition ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Form or List View */}
      {showForm ? (
        <AddressForm
          initialValues={editingAddress}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingAddress(null);
          }}
          submitting={submitting}
        />
      ) : loading ? (
        <Loader message="Loading saved addresses..." />
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm text-center">
          {error}
        </div>
      ) : addresses.length === 0 ? (
        <EmptyState
          message="No addresses saved yet."
          actionLabel="Add Delivery Address"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <AddressCard
              key={addr._id}
              address={addr}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onSetDefault={handleSetDefault}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressesPage;
