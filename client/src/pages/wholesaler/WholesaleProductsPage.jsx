import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getCategories } from '../../api/catalogApi.js';
import { getWholesaleProducts } from '../../api/wholesaleApi.js';
import { useWholesaleCart } from '../../context/WholesaleCartContext.jsx';
import WholesaleProductCard from '../../components/WholesaleProductCard.jsx';
import Loader from '../../components/Loader.jsx';
import EmptyState from '../../components/EmptyState.jsx';

const initialFilters = {
  search: '',
  category: '',
  sort: 'newest',
  page: 1,
  limit: 12
};

const WholesaleProductsPage = () => {
  const { addItem, cartCount } = useWholesaleCart();

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalResults: 0 });
  const [filters, setFilters] = useState(initialFilters);
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Debounce search — 400ms delay before triggering a fetch
  const searchTimerRef = useRef(null);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: value, page: 1 }));
    }, 400);
  };

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => clearTimeout(searchTimerRef.current);
  }, []);

  // Fetch categories once on mount
  useEffect(() => {
    getCategories()
      .then((data) => setCategories(data?.categories || []))
      .catch(() => {});
  }, []);

  // Fetch products whenever filters change
  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getWholesaleProducts(filters);
      setProducts(data?.products || []);
      setPagination({
        page: data?.page || 1,
        totalPages: data?.totalPages || 1,
        totalResults: data?.totalResults || 0
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load wholesale products.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setFilters(initialFilters);
  };

  /**
   * Called by WholesaleProductCard when the wholesaler clicks "Add to Cart".
   * Passes variantData + productName + qty to WholesaleCartContext.addItem().
   */
  const handleAddToCart = (variantData, productName, quantity) => {
    addItem(variantData, productName, quantity);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Page header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900">Wholesale Products</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Browse items with wholesale pricing, MOQ, and stock status.
          </p>
        </div>
        {/* Cart badge shortcut */}
        {cartCount > 0 && (
          <div className="flex items-center gap-2 bg-[#FDECEC] border border-[#C62828]/20 px-3 py-2 rounded-xl">
            <span className="text-xs font-bold text-[#C62828]">
              🛒 {cartCount} units in cart
            </span>
          </div>
        )}
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search wholesale products..."
            value={searchInput}
            onChange={handleSearchChange}
            className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#C62828]"
          />
          <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchInput && (
            <button
              onClick={() => {
                setSearchInput('');
                setFilters((prev) => ({ ...prev, search: '', page: 1 }));
              }}
              className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category filter */}
        <select
          value={filters.category}
          onChange={(e) => handleFilterChange('category', e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#C62828]"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={filters.sort}
          onChange={(e) => handleFilterChange('sort', e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#C62828]"
        >
          <option value="newest">Sort: Newest</option>
          <option value="priceLowHigh">Price: Low to High</option>
          <option value="priceHighLow">Price: High to Low</option>
        </select>

        {/* Clear */}
        {(filters.category || filters.search || filters.sort !== 'newest') && (
          <button
            onClick={handleClearFilters}
            className="text-xs text-gray-500 hover:text-[#C62828] font-medium whitespace-nowrap"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Product grid */}
      {loading ? (
        <Loader message="Loading wholesale products..." />
      ) : error ? (
        <div className="p-5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl text-center">
          {error}
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          message="No wholesale products found matching your filters."
          actionLabel="Clear Filters"
          onAction={handleClearFilters}
        />
      ) : (
        <>
          {/* Results count */}
          <div className="text-xs text-gray-500 flex justify-between items-center px-1">
            <span>
              Showing {products.length} of {pagination.totalResults} products
            </span>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map((product) => (
              <WholesaleProductCard
                key={product._id}
                product={product}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                disabled={filters.page <= 1}
                onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
                className="px-3 py-1.5 border border-gray-200 rounded text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="text-xs text-gray-500 font-medium px-2">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                disabled={filters.page >= pagination.totalPages}
                onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
                className="px-3 py-1.5 border border-gray-200 rounded text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WholesaleProductsPage;
