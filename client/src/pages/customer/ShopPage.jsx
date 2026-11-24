import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getProducts } from '../../api/catalogApi.js';
import ProductCard from '../../components/ProductCard.jsx';
import Loader from '../../components/Loader.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import useDocumentTitle from '../../hooks/useDocumentTitle.js';

const initialParams = {
  search: '',
  sort: 'newest',
  productRange: '', // '' for 'All', or 'regular', or 'diet'
  page: 1,
  limit: 12
};

const ShopPage = () => {
  useDocumentTitle('Shop');

  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalResults: 0 });
  const [params, setParams] = useState(initialParams);
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Debounce search input by 400ms
  const searchTimeoutRef = useRef(null);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setParams((prev) => ({ ...prev, search: value, page: 1 }));
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

  // Fetch products with search, sort, productRange, page, limit
  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProducts({
        search: params.search,
        sort: params.sort,
        productRange: params.productRange || undefined,
        page: params.page,
        limit: params.limit
      });
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
  }, [params]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleSortChange = (e) => {
    setParams((prev) => ({
      ...prev,
      sort: e.target.value,
      page: 1
    }));
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setParams((prev) => ({ ...prev, search: '', page: 1 }));
  };

  const handleRangeChange = (range) => {
    setParams((prev) => ({
      ...prev,
      productRange: range, // '' for All, 'regular', or 'diet'
      page: 1
    }));
  };

  return (
    <div className="py-6 space-y-6">
      {/* Page Title & Breadcrumb */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
          Catalogue & Shop
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Explore our wide range of authentic Gujarati namkeens, sev, and snacks.
        </p>
      </div>

      {/* Top Controls: Search Bar, Range Filter Pills, and Sort Dropdown */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-6 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search namkeen, sev, mixture..."
            value={searchInput}
            onChange={handleSearchChange}
            className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#C62828]"
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
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Diet / Regular Filter Pills */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-gray-50 p-1 rounded-xl border border-gray-200 shrink-0">
          {[
            { id: '', label: 'All' },
            { id: 'regular', label: 'Regular' },
            { id: 'diet', label: 'Diet' }
          ].map((tab) => {
            const isSelected = params.productRange === tab.id;
            return (
              <button
                key={tab.id || 'all'}
                type="button"
                onClick={() => handleRangeChange(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#C62828] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center space-x-2 shrink-0">
          <label className="text-xs text-gray-500 whitespace-nowrap">Sort by:</label>
          <select
            value={params.sort}
            onChange={handleSortChange}
            className="border border-gray-200 rounded-lg px-2.5 py-2 text-sm bg-white focus:outline-none focus:border-[#C62828]"
          >
            <option value="newest">Newest</option>
            <option value="popular">Popular</option>
            <option value="priceLowHigh">Price: Low to High</option>
            <option value="priceHighLow">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Product Grid Area */}
      <div>
        {loading ? (
          <Loader message="Loading fresh namkeens..." />
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg text-center">
            {error}
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            message={searchInput ? `No products found matching "${searchInput}".` : 'No products available.'}
            actionLabel={searchInput ? 'Clear Search' : undefined}
            onAction={searchInput ? handleClearSearch : undefined}
          />
        ) : (
          <>
            {/* Results count */}
            <div className="text-xs text-gray-500 mb-3 flex justify-between items-center">
              <span>Showing {products.length} of {pagination.totalResults} results</span>
            </div>

            {/* Responsive Product Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
              {products.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center space-x-2">
                <button
                  disabled={params.page <= 1}
                  onClick={() => setParams((prev) => ({ ...prev, page: prev.page - 1 }))}
                  className="px-3 py-1.5 border border-gray-200 rounded text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 cursor-pointer"
                >
                  Previous
                </button>
                <span className="px-3 py-1.5 text-xs text-gray-600 font-medium">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  disabled={params.page >= pagination.totalPages}
                  onClick={() => setParams((prev) => ({ ...prev, page: prev.page + 1 }))}
                  className="px-3 py-1.5 border border-gray-200 rounded text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 cursor-pointer"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ShopPage;
