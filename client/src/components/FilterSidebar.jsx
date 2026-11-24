import React from 'react';

const FilterSidebar = ({ categories = [], filters, onChange, onClear }) => {
  const weightOptions = [
    { value: '200', label: '200g' },
    { value: '500', label: '500g' }
  ];

  // Weight handler for single or multiple selection
  const handleWeightToggle = (val) => {
    // If filters.weight is equal to val, deselect it; otherwise set it
    const newWeight = filters.weight === val ? '' : val;
    onChange('weight', newWeight);
  };

  return (
    <aside className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-6">
      {/* Header & Clear */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <h3 className="text-base font-bold text-gray-800">Filters</h3>
        <button
          onClick={onClear}
          type="button"
          className="text-xs text-[#C62828] hover:text-[#8E1B1B] font-semibold underline cursor-pointer"
        >
          Clear Filters
        </button>
      </div>

      {/* Category Filter */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Category</h4>
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          <label className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer hover:text-black">
            <input
              type="radio"
              name="category"
              value=""
              checked={!filters.category}
              onChange={() => onChange('category', '')}
              className="text-[#C62828] focus:ring-[#C62828]"
            />
            <span>All Categories</span>
          </label>
          {categories.map((cat) => (
            <label
              key={cat._id}
              className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer hover:text-black"
            >
              <input
                type="radio"
                name="category"
                value={cat._id}
                checked={filters.category === cat._id}
                onChange={() => onChange('category', cat._id)}
                className="text-[#C62828] focus:ring-[#C62828]"
              />
              <span>{cat.categoryName}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range Filter */}
      <div className="pt-2 border-t border-gray-100">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Price Range (₹)</h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] text-gray-500 block mb-1">Min Price</label>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={filters.minPrice || ''}
              onChange={(e) => onChange('minPrice', e.target.value)}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded focus:border-[#C62828] focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[11px] text-gray-500 block mb-1">Max Price</label>
            <input
              type="number"
              min="0"
              placeholder="500"
              value={filters.maxPrice || ''}
              onChange={(e) => onChange('maxPrice', e.target.value)}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded focus:border-[#C62828] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Weight Filter */}
      <div className="pt-2 border-t border-gray-100">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Weight</h4>
        <div className="space-y-1.5">
          {weightOptions.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer hover:text-black"
            >
              <input
                type="checkbox"
                checked={filters.weight === opt.value}
                onChange={() => handleWeightToggle(opt.value)}
                className="rounded text-[#C62828] focus:ring-[#C62828]"
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Availability Filter */}
      <div className="pt-2 border-t border-gray-100">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Availability</h4>
        <label className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer hover:text-black">
          <input
            type="checkbox"
            checked={filters.inStock === 'true' || filters.inStock === true}
            onChange={(e) => onChange('inStock', e.target.checked ? 'true' : '')}
            className="rounded text-[#C62828] focus:ring-[#C62828]"
          />
          <span>In Stock Only</span>
        </label>
      </div>

      {/* Rating Filter */}
      <div className="pt-2 border-t border-gray-100">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Customer Rating</h4>
        <div className="space-y-1.5">
          <label className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer hover:text-black">
            <input
              type="radio"
              name="minRating"
              value=""
              checked={!filters.minRating}
              onChange={() => onChange('minRating', '')}
              className="text-[#C62828] focus:ring-[#C62828]"
            />
            <span>All Ratings</span>
          </label>
          <label className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer hover:text-black">
            <input
              type="radio"
              name="minRating"
              value="4"
              checked={filters.minRating === '4' || filters.minRating === 4}
              onChange={() => onChange('minRating', '4')}
              className="text-[#C62828] focus:ring-[#C62828]"
            />
            <span>4★ & above</span>
          </label>
          <label className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer hover:text-black">
            <input
              type="radio"
              name="minRating"
              value="3"
              checked={filters.minRating === '3' || filters.minRating === 3}
              onChange={() => onChange('minRating', '3')}
              className="text-[#C62828] focus:ring-[#C62828]"
            />
            <span>3★ & above</span>
          </label>
        </div>
      </div>
    </aside>
  );
};

export default FilterSidebar;
