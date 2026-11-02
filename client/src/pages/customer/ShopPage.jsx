import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getCategories, getProducts } from '../../api/catalogApi.js';
import { getWishlist, addToWishlist, removeFromWishlist } from '../../api/wishlistApi.js';
import ProductCard from '../../components/ProductCard.jsx';
import FilterSidebar from '../../components/FilterSidebar.jsx';
import Loader from '../../components/Loader.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import useDocumentTitle from '../../hooks/useDocumentTitle.js';

const initialFilters = {
  search: '',
  category: '',
  minPrice: '',
  maxPrice: '',
  weight: '',
  inStock: '',
  minRating: '',
  sort: 'newest',
  page: 1
};

const ShopPage = () => {
  useDocumentTitle('Shop');

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalResults: 0 });
  const [filters, setFilters] = useState(initialFilters);
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Debounce search input by 400ms
  const searchTimeoutRef = useRef(null);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: value, page: 1 }));
    }, 400);
  };

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Fetch categories once on mount
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const data = await getCategories();
        setCategories(data?.categories || []);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    fetchCats();
  }, []);

  // Fetch user wishlist once on mount
  useEffect(() => {
    const fetchUserWishlist = async () => {
      try {
        const data = await getWishlist();
        const items = data?.items || data?.wishlist || [];
        const idSet = new Set(
          items.map((item) => (item.product ? item.product._id : item.productId)).filter(Boolean)
        );
        setWishlistIds(idSet);
      } catch (err) {
        // Customer might not have wishlist or session
        console.log('Wishlist fetch note:', err.message);
      }
    };
    fetchUserWishlist();
  }, []);

  // Fetch products with current filters
  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProducts(filters);
      setProducts(data?.products || []);
      setPagination({
        page: data?.page || 1,
        totalPages: data?.totalPages || 1,
        totalResults: data?.totalResults || 0
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load products.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Filter change handler
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page on any filter change
    }));
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchInput('');
    setFilters(initialFilters);
  };

  // Wishlist toggle handler
  const handleWishlistToggle = async (productId) => {
    const isPresent = wishlistIds.has(productId);
    try {
      if (isPresent) {
        await removeFromWishlist(productId);
        setWishlistIds((prev) => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
      } else {
        await addToWishlist(productId);
        setWishlistIds((prev) => {
          const next = new Set(prev);
          next.add(productId);
          return next;
        });
      }
    } catch (err) {
      console.error('Wishlist toggle error:', err);
    }
  };

  // Calculate active filter count
  const activeFilterCount = [
    filters.category,
    filters.minPrice,
    filters.maxPrice,
    filters.weight,
    filters.inStock,
    filters.minRating
  ].filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Page Title & Breadcrumb */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
          Catalogue & Shop
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Explore our wide range of authentic Gujarati namkeens, sev, and snacks.
        </p>
      </div>

      {/* Category Pills (Horizontal Scrollable Row) */}
      <div className="mb-6 overflow-x-auto pb-2 scrollbar-none flex items-center gap-2">
        <button
          type="button"
          onClick={() => handleFilterChange('category', '')}
          className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shadow-xs cursor-pointer ${
            !filters.category
              ? 'bg-[#C62828] text-white shadow-sm'
              : 'bg-white border border-[#FDECEC] text-[#8E1B1B] hover:bg-[#FDECEC]'
          }`}
        >
          All Categories
        </button>
        {categories.map((cat) => {
          const isSelected = filters.category === cat._id;
          return (
            <button
              key={cat._id}
              type="button"
              onClick={() => handleFilterChange('category', cat._id)}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shadow-xs cursor-pointer ${
                isSelected
                  ? 'bg-[#C62828] text-white shadow-sm'
                  : 'bg-white border border-[#FDECEC] text-[#8E1B1B] hover:bg-[#FDECEC]'
              }`}
            >
              {cat.categoryName}
            </button>
          );
        })}
      </div>

      {/* Top Controls: Search Bar, Mobile Filter Button, Sort Dropdown */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-6 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search namkeen, sev, mixture..."
            value={searchInput}
            onChange={handleSearchChange}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#C62828]"
          />
          <svg
            className="w-4 h-4 text-gray-400 absolute left-3 top-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
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

        {/* Mobile Filter Button & Desktop Sort */}
        <div className="flex items-center justify-between gap-3">
          {/* Mobile Filter Drawer Button */}
          <button
            onClick={() => setIsMobileDrawerOpen(true)}
            className="md:hidden flex items-center space-x-1.5 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700"
          >
            <svg className="w-4 h-4 text-[#C62828]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span>Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}</span>
          </button>

          {/* Sort Dropdown */}
          <div className="flex items-center space-x-2">
            <label className="text-xs text-gray-500 whitespace-nowrap">Sort by:</label>
            <select
              value={filters.sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className="border border-gray-200 rounded-lg px-2.5 py-2 text-sm bg-white focus:outline-none focus:border-[#C62828]"
            >
              <option value="newest">Newest</option>
              <option value="popular">Popular</option>
              <option value="priceLowHigh">Price: Low to High</option>
              <option value="priceHighLow">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: Sidebar + Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Desktop Sidebar */}
        <div className="hidden md:block md:col-span-1 sticky top-20">
          <FilterSidebar
            categories={categories}
            filters={filters}
            onChange={handleFilterChange}
            onClear={handleClearFilters}
          />
        </div>

        {/* Product Grid Area */}
        <div className="md:col-span-3">
          {loading ? (
            <Loader message="Loading fresh namkeens..." />
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg text-center">
              {error}
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              message="No products found matching your selected filters."
              actionLabel="Clear Filters"
              onAction={handleClearFilters}
            />
          ) : (
            <>
              {/* Results count */}
              <div className="text-xs text-gray-500 mb-3 flex justify-between items-center">
                <span>Showing {products.length} of {pagination.totalResults} results</span>
                {activeFilterCount > 0 && (
                  <span className="text-[#C62828] font-medium">
                    {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
                  </span>
                )}
              </div>

              {/* Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {products.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    isWishlisted={wishlistIds.has(product._id)}
                    onWishlistToggle={handleWishlistToggle}
                  />
                ))}
              </div>

              {/* Pagination Controls */}
              {pagination.totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center space-x-2">
                  <button
                    disabled={filters.page <= 1}
                    onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
                    className="px-3 py-1.5 border border-gray-200 rounded text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1.5 text-xs text-gray-600 font-medium">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    disabled={filters.page >= pagination.totalPages}
                    onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
                    className="px-3 py-1.5 border border-gray-200 rounded text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Slide-Over Drawer for Filters */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div
            onClick={() => setIsMobileDrawerOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
          />

          {/* Drawer content */}
          <div className="relative ml-auto w-full max-w-xs bg-white h-full shadow-2xl p-4 overflow-y-auto z-10 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
              <h2 className="text-base font-bold text-gray-800">Filter Products</h2>
              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                className="text-gray-400 hover:text-black p-1 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <FilterSidebar
              categories={categories}
              filters={filters}
              onChange={handleFilterChange}
              onClear={handleClearFilters}
            />

            <div className="mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                className="w-full py-2.5 bg-[#C62828] text-white font-semibold text-sm rounded-lg"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopPage;
