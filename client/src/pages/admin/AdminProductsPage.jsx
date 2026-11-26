import React, { useState, useEffect, useCallback } from 'react';
import { getAdminProducts, updateAdminVariant, updateAdminStock, createAdminProduct } from '../../api/adminApi.js';
import { getCategories } from '../../api/catalogApi.js';
import Loader from '../../components/Loader.jsx';
import EmptyState from '../../components/EmptyState.jsx';

const AdminProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Categories list for product creation
  const [categories, setCategories] = useState([]);

  // Create Product Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createFeedback, setCreateFeedback] = useState(null);
  const [newProductData, setNewProductData] = useState({
    productName: '',
    categoryId: '',
    productRange: 'regular',
    description: '',
    weight: '250',
    unit: 'g',
    sellingPrice: '',
    wholesalePrice: '',
    stockQuantity: '50',
    lowStockThreshold: '10'
  });

  // Edit Modal State
  const [editingVariant, setEditingVariant] = useState(null);
  const [editProduct, setEditProduct] = useState(null);
  const [formFields, setFormFields] = useState({
    sellingPrice: '',
    wholesalePrice: '',
    availableQuantity: '',
    lowStockThreshold: ''
  });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fetchCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data.categories || []);
      if (data.categories?.length > 0 && !newProductData.categoryId) {
        setNewProductData((prev) => ({ ...prev, categoryId: data.categories[0]._id }));
      }
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminProducts({ search, page, limit: 12 });
      setProducts(data.products || []);
      setTotalPages(data.totalPages || 1);
      setTotalProducts(data.total || (data.products || []).length);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load products.');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts]);

  const handleOpenAddModal = () => {
    setCreateFeedback(null);
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setCreateFeedback(null);
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!newProductData.productName || !newProductData.categoryId) {
      setCreateFeedback({ type: 'error', message: 'Product name and category are required.' });
      return;
    }

    if (!newProductData.sellingPrice || !newProductData.wholesalePrice) {
      setCreateFeedback({ type: 'error', message: 'Selling price and wholesale price are required.' });
      return;
    }

    setCreating(true);
    setCreateFeedback(null);

    try {
      const skuCode = `${newProductData.productName.slice(0, 3).toUpperCase()}-${newProductData.weight}${newProductData.unit}-${Date.now().toString().slice(-4)}`;

      const payload = {
        categoryId: newProductData.categoryId,
        productName: newProductData.productName.trim(),
        productRange: newProductData.productRange,
        description: newProductData.description.trim(),
        variants: [
          {
            weight: Number(newProductData.weight),
            unit: newProductData.unit,
            displayName: `${newProductData.productName.trim()} - ${newProductData.weight}${newProductData.unit}`,
            sellingPrice: Number(newProductData.sellingPrice),
            wholesalePrice: Number(newProductData.wholesalePrice),
            sku: skuCode,
            initialQuantity: Number(newProductData.stockQuantity) || 0,
            lowStockThreshold: Number(newProductData.lowStockThreshold) || 10
          }
        ]
      };

      await createAdminProduct(payload);

      setCreateFeedback({ type: 'success', message: 'Product created successfully with initial stock & variant!' });
      
      // Reset form
      setNewProductData({
        productName: '',
        categoryId: categories[0]?._id || '',
        productRange: 'regular',
        description: '',
        weight: '250',
        unit: 'g',
        sellingPrice: '',
        wholesalePrice: '',
        stockQuantity: '50',
        lowStockThreshold: '10'
      });

      // Refresh product list
      await fetchProducts();

      setTimeout(() => {
        handleCloseAddModal();
      }, 1200);
    } catch (err) {
      setCreateFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to create product. Please try again.'
      });
    } finally {
      setCreating(false);
    }
  };

  const openEditModal = (product, variant) => {
    setEditProduct(product);
    setEditingVariant(variant);
    setFormFields({
      sellingPrice: variant.sellingPrice ?? '',
      wholesalePrice: variant.wholesalePrice ?? '',
      availableQuantity: variant.stock?.availableQuantity ?? 0,
      lowStockThreshold: variant.stock?.lowStockThreshold ?? 10
    });
    setFeedback(null);
  };

  const closeEditModal = () => {
    setEditingVariant(null);
    setEditProduct(null);
    setFeedback(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editingVariant) return;

    setSaving(true);
    setFeedback(null);

    try {
      // 1. Update prices on the variant
      await updateAdminVariant(editingVariant._id, {
        sellingPrice: Number(formFields.sellingPrice),
        wholesalePrice: Number(formFields.wholesalePrice)
      });

      // 2. Update stock quantity & threshold
      await updateAdminStock(editingVariant._id, {
        availableQuantity: Number(formFields.availableQuantity),
        lowStockThreshold: Number(formFields.lowStockThreshold)
      });

      setFeedback({ type: 'success', message: 'Updated price & stock quantity successfully!' });
      
      // Refresh listing
      await fetchProducts();

      setTimeout(() => {
        closeEditModal();
      }, 1000);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to update variant details.'
      });
    } finally {
      setSaving(false);
    }
  };

  const getStockStatusBadge = (status) => {
    if (status === 'in_stock') {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
    if (status === 'low_stock') {
      return 'bg-amber-100 text-amber-800 border-amber-200';
    }
    return 'bg-red-100 text-[#C62828] border-red-200';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#C62828] block">
            Inventory & Catalog Management
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Manage Products & Stock Pricing
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            View catalogue products, adjust retail/wholesale prices, and update live inventory quantities.
          </p>
        </div>

        {/* Actions & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#C62828] hover:bg-[#8E1B1B] text-white text-xs sm:text-sm font-bold rounded-xl transition shadow-xs cursor-pointer shrink-0"
          >
            <span className="text-base leading-none font-black">+</span>
            <span>Add Product</span>
          </button>

          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Search products by name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#C62828]"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-16">
          <Loader message="Loading products and inventory records..." />
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 text-center">
          {error}
        </div>
      ) : products.length === 0 ? (
        <EmptyState message="No products found in catalogue." />
      ) : (
        <>
          <div className="text-xs text-gray-500 flex justify-between items-center">
            <span>Showing {products.length} of {totalProducts} products</span>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div
                key={product._id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition"
              >
                <div>
                  {/* Category & Status */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-[#C62828] uppercase tracking-wide">
                      {product.categoryId?.categoryName || 'General'}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      product.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {product.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Title & Image thumbnail */}
                  <div className="flex items-center space-x-3">
                    <div className="w-14 h-14 rounded-xl bg-[#FFF9F9] border border-gray-100 shrink-0 overflow-hidden flex items-center justify-center">
                      {product.productImages?.[0] ? (
                        <img
                          src={product.productImages[0]}
                          alt={product.productName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-[10px] text-gray-400">No Image</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm line-clamp-1">
                        {product.productName}
                      </h3>
                      <span className="text-xs text-gray-400">
                        {product.variants?.length || 0} variant(s)
                      </span>
                    </div>
                  </div>

                  {/* Variants List with Quick Edit */}
                  <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                      Variants & Stock Quantities
                    </span>
                    {product.variants?.map((v) => (
                      <div
                        key={v._id}
                        className="p-2.5 rounded-xl bg-gray-50/80 border border-gray-100 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-1.5 font-bold text-gray-800">
                            <span>{v.displayName || `${v.weight}${v.unit}`}</span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded-full border ${getStockStatusBadge(v.stockStatus)}`}>
                              {v.stockStatus?.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="text-[11px] text-gray-500 mt-0.5">
                            Retail: <b className="text-gray-900">₹{v.sellingPrice}</b> • Wholesale: <b className="text-gray-900">₹{v.wholesalePrice || 'N/A'}</b>
                          </div>
                          <div className="text-[11px] text-gray-500">
                            Stock: <b className="text-[#C62828] font-black">{v.stock?.availableQuantity ?? 0}</b> units (reserved: {v.stock?.reservedQuantity ?? 0})
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => openEditModal(product, v)}
                          className="px-2.5 py-1.5 bg-white border border-gray-200 hover:border-[#C62828] hover:text-[#C62828] font-bold rounded-lg text-xs transition shadow-2xs cursor-pointer"
                        >
                          Edit
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stock Summary Footnote */}
                <div className="pt-2 border-t border-gray-50 flex items-center justify-between text-[11px] text-gray-500">
                  <span>Total Available:</span>
                  <span className="font-bold text-gray-900">
                    {product.stockSummary?.totalAvailable ?? 0} units
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 pt-6">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 bg-white border border-gray-200 text-xs font-semibold rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="text-xs text-gray-500">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 bg-white border border-gray-200 text-xs font-semibold rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Edit Variant Modal */}
      {editingVariant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Edit Price & Inventory
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {editProduct?.productName} — {editingVariant.displayName || `${editingVariant.weight}${editingVariant.unit}`}
                </p>
              </div>
              <button
                onClick={closeEditModal}
                className="text-gray-400 hover:text-black font-bold p-1 text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            {feedback && (
              <div
                className={`mt-4 p-3 rounded-xl text-xs font-bold ${
                  feedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {feedback.message}
              </div>
            )}

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              {/* Selling Price */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Customer Retail Price (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={formFields.sellingPrice}
                  onChange={(e) => setFormFields((prev) => ({ ...prev, sellingPrice: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#C62828]"
                />
              </div>

              {/* Wholesale Price */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Wholesale Bulk Price (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={formFields.wholesalePrice}
                  onChange={(e) => setFormFields((prev) => ({ ...prev, wholesalePrice: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#C62828]"
                />
              </div>

              {/* Available Stock Quantity */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Available Stock Quantity (Units) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={formFields.availableQuantity}
                  onChange={(e) => setFormFields((prev) => ({ ...prev, availableQuantity: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#C62828]"
                />
              </div>

              {/* Low Stock Threshold */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Low Stock Threshold Alert (Units)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formFields.lowStockThreshold}
                  onChange={(e) => setFormFields((prev) => ({ ...prev, lowStockThreshold: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#C62828]"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-black"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-[#C62828] hover:bg-[#8E1B1B] text-white text-xs font-bold rounded-xl transition shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full p-6 border-t-4 border-[#C62828] relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Add New Product</h3>
                <p className="text-xs text-gray-500">Create a new product with initial variant, price & stock.</p>
              </div>
              <button
                type="button"
                onClick={handleCloseAddModal}
                className="text-gray-400 hover:text-black font-bold text-lg p-1"
              >
                ✕
              </button>
            </div>

            {createFeedback && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold mb-4 border ${
                  createFeedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}
              >
                {createFeedback.message}
              </div>
            )}

            <form onSubmit={handleCreateProduct} className="space-y-4">
              {/* Product Name */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diet Roasted Makhana or Ratlami Sev"
                  value={newProductData.productName}
                  onChange={(e) => setNewProductData((prev) => ({ ...prev, productName: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#C62828]"
                />
              </div>

              {/* Category & Product Range */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Category *
                  </label>
                  <select
                    required
                    value={newProductData.categoryId}
                    onChange={(e) => setNewProductData((prev) => ({ ...prev, categoryId: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#C62828] bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.categoryName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Product Range (Diet / Regular) *
                  </label>
                  <select
                    value={newProductData.productRange}
                    onChange={(e) => setNewProductData((prev) => ({ ...prev, productRange: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#C62828] bg-white font-medium"
                  >
                    <option value="regular">Regular Range</option>
                    <option value="diet">Diet Range (Green Badge)</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Short Description
                </label>
                <textarea
                  rows="2"
                  placeholder="Briefly describe the product taste, ingredients, or specialty..."
                  value={newProductData.description}
                  onChange={(e) => setNewProductData((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#C62828]"
                />
              </div>

              {/* Initial Variant Details */}
              <div className="bg-gray-50/80 p-3.5 rounded-xl border border-gray-200 space-y-3">
                <span className="text-[11px] font-bold text-[#C62828] uppercase tracking-wider block">
                  Initial Pack Size & Pricing
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">Weight *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="250"
                      value={newProductData.weight}
                      onChange={(e) => setNewProductData((prev) => ({ ...prev, weight: e.target.value }))}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#C62828]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">Unit *</label>
                    <select
                      value={newProductData.unit}
                      onChange={(e) => setNewProductData((prev) => ({ ...prev, unit: e.target.value }))}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#C62828]"
                    >
                      <option value="g">grams (g)</option>
                      <option value="kg">kg</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">Retail (₹) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      placeholder="120"
                      value={newProductData.sellingPrice}
                      onChange={(e) => setNewProductData((prev) => ({ ...prev, sellingPrice: e.target.value }))}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#C62828]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">Wholesale (₹) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      placeholder="90"
                      value={newProductData.wholesalePrice}
                      onChange={(e) => setNewProductData((prev) => ({ ...prev, wholesalePrice: e.target.value }))}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#C62828]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-gray-200/60">
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">Initial Stock (Units) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="50"
                      value={newProductData.stockQuantity}
                      onChange={(e) => setNewProductData((prev) => ({ ...prev, stockQuantity: e.target.value }))}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#C62828]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">Low Stock Alert Threshold</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="10"
                      value={newProductData.lowStockThreshold}
                      onChange={(e) => setNewProductData((prev) => ({ ...prev, lowStockThreshold: e.target.value }))}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#C62828]"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={handleCloseAddModal}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-black cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2.5 bg-[#C62828] hover:bg-[#8E1B1B] text-white text-xs font-bold rounded-xl transition shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {creating ? 'Creating Product...' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductsPage;
