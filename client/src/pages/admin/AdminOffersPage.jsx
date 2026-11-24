import React, { useState, useEffect } from 'react';
import {
  getAdminOffers,
  createOffer,
  updateOffer,
  deleteOffer,
  toggleOfferActive
} from '../../api/adminOfferApi.js';
import { getAdminProducts } from '../../api/adminApi.js';
import { getCategories } from '../../api/catalogApi.js';
import Loader from '../../components/Loader.jsx';
import EmptyState from '../../components/EmptyState.jsx';

/**
 * AdminOffersPage
 *
 * Phase 16: Admin Offers management interface with:
 * - Table view: Offer Name, Category, Discount, Validity, Status Badge, and Actions (Edit, Delete, Activate/Deactivate).
 * - Dynamic form modal matching 3 offerCategory types:
 *    1) "product_discount": Applies-to (all / category / specific products picker), start/end date, % or flat discount.
 *    2) "cart_threshold": Minimum cart subtotal (₹), % or flat discount, start/end date.
 *    3) "loyalty_customer": Loyalty criteria type (orders or spend), criteria value, % or flat discount, start/end date.
 * - Client-side validation for dates, positive values, and category-specific requirements.
 * - Category dropdown is disabled during edit to prevent field mismatch issues.
 */
const AdminOffersPage = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Form Fields
  const [formData, setFormData] = useState({
    offerName: '',
    description: '',
    offerCategory: 'product_discount',
    minCartValue: '',
    loyaltyCriteriaType: 'min_delivered_orders',
    loyaltyCriteriaValue: '',
    discountType: 'percentage',
    discountValue: '',
    applicableTo: 'all_products',
    categoryId: '',
    productIds: [],
    startDate: '',
    endDate: '',
    isActive: true
  });

  const showBannerFeedback = (message, type = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 3500);
  };

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const res = await getAdminOffers({ status: statusFilter });
      setOffers(res?.offers || []);
    } catch (err) {
      showBannerFeedback(err.response?.data?.message || 'Failed to fetch offers', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Initial load: offers when filter changes
  useEffect(() => {
    fetchOffers();
  }, [statusFilter]);

  // Load dropdown data (categories and products) once
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          getCategories(),
          getAdminProducts({ limit: 100 })
        ]);
        setCategories(catRes?.categories || []);
        setProducts(prodRes?.products || []);
      } catch (err) {
        console.error('Error loading metadata for offers', err);
      }
    };
    loadMetadata();
  }, []);

  const openCreateModal = () => {
    setEditingOffer(null);
    setFormError(null);
    setFormData({
      offerName: '',
      description: '',
      offerCategory: 'product_discount',
      minCartValue: '',
      loyaltyCriteriaType: 'min_delivered_orders',
      loyaltyCriteriaValue: '',
      discountType: 'percentage',
      discountValue: '',
      applicableTo: 'all_products',
      categoryId: categories[0]?._id || '',
      productIds: [],
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      isActive: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (offer) => {
    setEditingOffer(offer);
    setFormError(null);
    setFormData({
      offerName: offer.offerName || '',
      description: offer.description || '',
      offerCategory: offer.offerCategory || 'product_discount',
      minCartValue: offer.minCartValue || '',
      loyaltyCriteriaType: offer.loyaltyCriteriaType || 'min_delivered_orders',
      loyaltyCriteriaValue: offer.loyaltyCriteriaValue || '',
      discountType: offer.discountType || 'percentage',
      discountValue: offer.discountValue || '',
      applicableTo: offer.applicableTo || 'all_products',
      categoryId: offer.categoryId?._id || offer.categoryId || '',
      productIds: Array.isArray(offer.productIds)
        ? offer.productIds.map((p) => (typeof p === 'object' ? p._id : p))
        : [],
      startDate: offer.startDate ? new Date(offer.startDate).toISOString().slice(0, 10) : '',
      endDate: offer.endDate ? new Date(offer.endDate).toISOString().slice(0, 10) : '',
      isActive: offer.isActive ?? true
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    // Client-side validation matching each category
    if (!formData.offerName.trim()) {
      setFormError('Offer name is required');
      return;
    }
    const val = Number(formData.discountValue);
    if (!val || val <= 0) {
      setFormError('Discount value must be a positive number');
      return;
    }
    if (formData.discountType === 'percentage' && (val < 1 || val > 90)) {
      setFormError('Percentage discount must be between 1% and 90%');
      return;
    }

    if (formData.offerCategory === 'cart_threshold') {
      const minVal = Number(formData.minCartValue);
      if (!minVal || minVal <= 0) {
        setFormError('Minimum Cart Value (₹) must be a positive number');
        return;
      }
    } else if (formData.offerCategory === 'loyalty_customer') {
      const critVal = Number(formData.loyaltyCriteriaValue);
      if (!critVal || critVal <= 0) {
        setFormError(
          formData.loyaltyCriteriaType === 'min_delivered_orders'
            ? 'Minimum delivered orders must be a positive number'
            : 'Minimum lifetime spend (₹) must be a positive number'
        );
        return;
      }
    } else {
      // product_discount
      if (formData.applicableTo === 'category' && !formData.categoryId) {
        setFormError('Please select a category');
        return;
      }
      if (formData.applicableTo === 'specific_products' && formData.productIds.length === 0) {
        setFormError('Please select at least one product');
        return;
      }
    }

    if (!formData.startDate || !formData.endDate) {
      setFormError('Start date and End date are required');
      return;
    }
    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      setFormError('End date must be strictly after start date');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        offerName: formData.offerName.trim(),
        description: formData.description.trim(),
        offerCategory: formData.offerCategory,
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        startDate: formData.startDate,
        endDate: formData.endDate,
        isActive: formData.isActive,
        // Specific fields per category
        minCartValue: formData.offerCategory === 'cart_threshold' ? Number(formData.minCartValue) : undefined,
        loyaltyCriteriaType: formData.offerCategory === 'loyalty_customer' ? formData.loyaltyCriteriaType : undefined,
        loyaltyCriteriaValue: formData.offerCategory === 'loyalty_customer' ? Number(formData.loyaltyCriteriaValue) : undefined,
        applicableTo: formData.offerCategory === 'product_discount' ? formData.applicableTo : undefined,
        categoryId: formData.offerCategory === 'product_discount' && formData.applicableTo === 'category' ? formData.categoryId : undefined,
        productIds: formData.offerCategory === 'product_discount' && formData.applicableTo === 'specific_products' ? formData.productIds : undefined
      };

      if (editingOffer) {
        await updateOffer(editingOffer._id, payload);
        showBannerFeedback('Offer updated successfully');
      } else {
        await createOffer(payload);
        showBannerFeedback('Offer created successfully');
      }
      setIsModalOpen(false);
      fetchOffers();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error saving offer');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (offer) => {
    try {
      await toggleOfferActive(offer._id, !offer.isActive);
      showBannerFeedback(
        `Offer ${!offer.isActive ? 'activated' : 'deactivated'} successfully`
      );
      fetchOffers();
    } catch (err) {
      showBannerFeedback(err.response?.data?.message || 'Failed to toggle status', 'error');
    }
  };

  const handleDelete = async (offer) => {
    if (!window.confirm(`Are you sure you want to delete offer "${offer.offerName}"?`)) {
      return;
    }
    try {
      await deleteOffer(offer._id);
      showBannerFeedback('Offer deleted successfully');
      fetchOffers();
    } catch (err) {
      showBannerFeedback(err.response?.data?.message || 'Failed to delete offer', 'error');
    }
  };

  // Status badge computation based on startDate, endDate, and isActive
  const getStatusBadge = (offer) => {
    const now = new Date();
    const start = new Date(offer.startDate);
    const end = new Date(offer.endDate);

    if (!offer.isActive) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
          Inactive
        </span>
      );
    }
    if (now < start) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
          Upcoming
        </span>
      );
    }
    if (now > end) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
          Expired
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
        Active
      </span>
    );
  };

  const getCategoryLabel = (category) => {
    switch (category) {
      case 'cart_threshold':
        return 'Cart Threshold';
      case 'loyalty_customer':
        return 'Loyalty';
      case 'product_discount':
      default:
        return 'Product Discount';
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-sm font-semibold flex items-center justify-between ${
            feedback.type === 'error'
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          }`}
        >
          <span>{feedback.message}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs uppercase font-bold tracking-wider underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            Offers & Discounts
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Manage Product Discounts, Cart Threshold deals, and Loyalty Customer rewards.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#C62828] hover:bg-[#8E1B1B] text-white rounded-xl text-sm font-bold shadow-sm transition active:scale-95 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
          Add Offer
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-3 overflow-x-auto">
        {['all', 'active', 'upcoming', 'expired'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold capitalize transition cursor-pointer ${
              statusFilter === status
                ? 'bg-[#C62828] text-white shadow-xs'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Offers Table */}
      {loading ? (
        <Loader message="Loading offers..." />
      ) : offers.length === 0 ? (
        <EmptyState
          title="No offers created yet."
          message={`There are no ${statusFilter === 'all' ? '' : statusFilter} offers right now.`}
          actionLabel="Add Offer"
          onAction={openCreateModal}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Offer Name</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Discount</th>
                  <th className="py-3.5 px-4">Scope / Rule</th>
                  <th className="py-3.5 px-4">Validity</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {offers.map((offer) => {
                  const isPercentage = offer.discountType === 'percentage';
                  const discountFormatted = isPercentage ? `${offer.discountValue}%` : `₹${offer.discountValue}`;

                  return (
                    <tr key={offer._id} className="hover:bg-gray-50/60 transition-colors">
                      {/* Offer Name */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-900">{offer.offerName}</div>
                        {offer.description && (
                          <div className="text-xs text-gray-400 line-clamp-1 mt-0.5">
                            {offer.description}
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold ${
                          offer.offerCategory === 'cart_threshold'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : offer.offerCategory === 'loyalty_customer'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-red-50 text-[#C62828] border border-red-100'
                        }`}>
                          {getCategoryLabel(offer.offerCategory)}
                        </span>
                      </td>

                      {/* Discount */}
                      <td className="py-3.5 px-4 font-black text-gray-900 whitespace-nowrap">
                        {discountFormatted}
                      </td>

                      {/* Scope / Rule */}
                      <td className="py-3.5 px-4 text-xs text-gray-600">
                        {offer.offerCategory === 'cart_threshold' && (
                          <span className="font-semibold text-gray-800">
                            Min Cart: ₹{offer.minCartValue}
                          </span>
                        )}
                        {offer.offerCategory === 'loyalty_customer' && (
                          <span className="font-semibold text-emerald-700">
                            {offer.loyaltyCriteriaType === 'min_delivered_orders'
                              ? `Min ${offer.loyaltyCriteriaValue} orders`
                              : `Min ₹${offer.loyaltyCriteriaValue} spend`}
                          </span>
                        )}
                        {(!offer.offerCategory || offer.offerCategory === 'product_discount') && (
                          <span className="capitalize">
                            {offer.applicableTo === 'all_products' && 'All Products'}
                            {offer.applicableTo === 'category' && (
                              <span>Category: {offer.categoryId?.categoryName || 'Selected'}</span>
                            )}
                            {offer.applicableTo === 'specific_products' && (
                              <span>{offer.productIds?.length || 0} product(s)</span>
                            )}
                          </span>
                        )}
                      </td>

                      {/* Validity */}
                      <td className="py-3.5 px-4 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(offer.startDate).toLocaleDateString()} – {new Date(offer.endDate).toLocaleDateString()}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getStatusBadge(offer)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          {/* Activate / Deactivate Toggle */}
                          <button
                            onClick={() => handleToggleActive(offer)}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                              offer.isActive
                                ? 'border-gray-200 text-gray-600 hover:bg-gray-100'
                                : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                            }`}
                            title={offer.isActive ? 'Deactivate this offer' : 'Activate this offer'}
                          >
                            {offer.isActive ? 'Deactivate' : 'Activate'}
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => openEditModal(offer)}
                            className="px-2.5 py-1 text-xs font-semibold text-gray-700 hover:text-black hover:bg-gray-100 rounded-lg transition cursor-pointer"
                          >
                            Edit
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDelete(offer)}
                            className="px-2.5 py-1 text-xs font-semibold text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Offer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-gray-100 overflow-hidden my-8">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-black text-gray-900">
                {editingOffer ? 'Edit Offer' : 'Add New Offer'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
                  {formError}
                </div>
              )}

              {/* FIRST Field: Offer Category Dropdown */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Offer Category *
                </label>
                <select
                  disabled={!!editingOffer}
                  value={formData.offerCategory}
                  onChange={(e) => setFormData({ ...formData, offerCategory: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#C62828] bg-white disabled:bg-gray-100 disabled:text-gray-500 cursor-pointer"
                >
                  <option value="product_discount">Product Discount</option>
                  <option value="cart_threshold">Cart Threshold</option>
                  <option value="loyalty_customer">Loyalty Customer</option>
                </select>
                {editingOffer && (
                  <p className="text-[11px] text-gray-400 mt-1">
                    Offer category cannot be changed on edit. Please delete and recreate if a different category is required.
                  </p>
                )}
              </div>

              {/* Offer Name */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Offer Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diwali Dhamaka Special"
                  value={formData.offerName}
                  onChange={(e) => setFormData({ ...formData, offerName: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#C62828]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Description
                </label>
                <textarea
                  rows="2"
                  placeholder="Short description of this offer"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#C62828]"
                />
              </div>

              {/* Discount Type & Value */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Discount Type *
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#C62828]"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Discount Value * {formData.discountType === 'percentage' ? '(1-90%)' : '(₹)'}
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={formData.discountType === 'percentage' ? '90' : undefined}
                    placeholder={formData.discountType === 'percentage' ? '20' : '50'}
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#C62828]"
                  />
                </div>
              </div>

              {/* ----------------------------------------------------------------- */}
              {/* Category-Specific Form Fields                                    */}
              {/* ----------------------------------------------------------------- */}

              {/* CASE 1: PRODUCT DISCOUNT (Applies To, Category dropdown, Product picker) */}
              {formData.offerCategory === 'product_discount' && (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      Applies To *
                    </label>
                    <select
                      value={formData.applicableTo}
                      onChange={(e) => setFormData({ ...formData, applicableTo: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#C62828]"
                    >
                      <option value="all_products">All Products</option>
                      <option value="category">Specific Category</option>
                      <option value="specific_products">Specific Products</option>
                    </select>
                  </div>

                  {formData.applicableTo === 'category' && (
                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">
                        Select Category *
                      </label>
                      <select
                        value={formData.categoryId}
                        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#C62828]"
                      >
                        <option value="">-- Choose Category --</option>
                        {categories.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.categoryName}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {formData.applicableTo === 'specific_products' && (
                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">
                        Select Products * ({formData.productIds.length} selected)
                      </label>
                      <div className="max-h-36 overflow-y-auto border border-gray-200 rounded-xl p-2 space-y-1">
                        {products.map((p) => {
                          const checked = formData.productIds.includes(p._id);
                          return (
                            <label
                              key={p._id}
                              className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded-lg text-xs cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormData({
                                      ...formData,
                                      productIds: [...formData.productIds, p._id]
                                    });
                                  } else {
                                    setFormData({
                                      ...formData,
                                      productIds: formData.productIds.filter((id) => id !== p._id)
                                    });
                                  }
                                }}
                              />
                              <span className="text-gray-800 font-medium">{p.productName}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* CASE 2: CART THRESHOLD (Minimum Cart Value) */}
              {formData.offerCategory === 'cart_threshold' && (
                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl space-y-2">
                  <label className="text-xs font-bold text-gray-700 block">
                    Minimum Cart Value (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 500"
                    value={formData.minCartValue}
                    onChange={(e) => setFormData({ ...formData, minCartValue: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#C62828] bg-white"
                  />
                  <p className="text-[11px] text-gray-500">
                    Discount automatically unlocks when customer cart subtotal meets or exceeds this amount.
                  </p>
                </div>
              )}

              {/* CASE 3: LOYALTY CUSTOMER (Criteria Type & Criteria Value) */}
              {formData.offerCategory === 'loyalty_customer' && (
                <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-3">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      Loyalty Criteria Type *
                    </label>
                    <select
                      value={formData.loyaltyCriteriaType}
                      onChange={(e) => setFormData({ ...formData, loyaltyCriteriaType: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600 bg-white"
                    >
                      <option value="min_delivered_orders">Minimum Delivered Orders</option>
                      <option value="min_total_spend">Minimum Total Spend</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      {formData.loyaltyCriteriaType === 'min_delivered_orders'
                        ? 'Minimum delivered orders *'
                        : 'Minimum lifetime spend (₹) *'}
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder={formData.loyaltyCriteriaType === 'min_delivered_orders' ? 'e.g. 3' : 'e.g. 2000'}
                      value={formData.loyaltyCriteriaValue}
                      onChange={(e) => setFormData({ ...formData, loyaltyCriteriaValue: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600 bg-white"
                    />
                    <p className="text-[11px] text-gray-500 mt-1">
                      {formData.loyaltyCriteriaType === 'min_delivered_orders'
                        ? 'Customers who have at least this number of delivered orders automatically receive this discount.'
                        : 'Customers whose cumulative spend across delivered orders meets or exceeds this amount receive this discount.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Start & End Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#C62828]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#C62828]"
                  />
                </div>
              </div>

              {/* Is Active Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded text-[#C62828] focus:ring-[#C62828]"
                />
                <label htmlFor="isActiveToggle" className="text-xs font-semibold text-gray-700 cursor-pointer">
                  Activate offer immediately upon saving
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs font-bold bg-[#C62828] hover:bg-[#8E1B1B] text-white rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Saving...' : editingOffer ? 'Save Changes' : 'Create Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOffersPage;
