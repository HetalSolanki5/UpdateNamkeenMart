import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getProductById } from '../../api/catalogApi.js';
import { useCart } from '../../context/CartContext.jsx';
import Loader from '../../components/Loader.jsx';
import EmptyState from '../../components/EmptyState.jsx';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('description');
  const [actionFeedback, setActionFeedback] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);

  // Load product detail
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const prodData = await getProductById(id);
        const fetchedProduct = prodData?.product || prodData;
        setProduct(fetchedProduct);

        // Set initial selected variant
        if (fetchedProduct?.variants && fetchedProduct.variants.length > 0) {
          // Prefer first in-stock variant, otherwise first variant
          const initialVariant =
            fetchedProduct.variants.find((v) => v.stockStatus !== 'out_of_stock') ||
            fetchedProduct.variants[0];
          setSelectedVariant(initialVariant);
        }

        // Set initial image
        if (fetchedProduct?.productImages && fetchedProduct.productImages.length > 0) {
          setSelectedImage(fetchedProduct.productImages[0]);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Product not found.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Temporary feedback toast
  const showFeedback = (msg, type = 'success') => {
    setActionFeedback({ message: msg, type });
    setTimeout(() => {
      setActionFeedback(null);
    }, 2500);
  };

  // Add to Cart handler
  const handleAddToCart = async () => {
    if (!selectedVariant || selectedVariant.stockStatus === 'out_of_stock') return;
    setAddingToCart(true);
    const result = await addItem(selectedVariant._id, quantity);
    setAddingToCart(false);

    if (result.success) {
      showFeedback(`Added ${quantity} item(s) to cart!`);
    } else {
      showFeedback(result.error || 'Failed to add item', 'error');
    }
  };

  // Buy Now handler
  const handleBuyNow = async () => {
    if (!selectedVariant || selectedVariant.stockStatus === 'out_of_stock') return;
    setAddingToCart(true);
    const result = await addItem(selectedVariant._id, quantity);
    setAddingToCart(false);

    if (result.success) {
      navigate('/customer/cart');
    } else {
      showFeedback(result.error || 'Failed to add item', 'error');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <Loader message="Loading product details..." />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <EmptyState
          message={error || 'Product not found.'}
          actionLabel="Back to Shop"
          onAction={() => navigate('/customer/shop')}
        />
      </div>
    );
  }

  const isOutOfStock = selectedVariant?.stockStatus === 'out_of_stock';
  const isLowStock = selectedVariant?.stockStatus === 'low_stock';

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-6">
      {/* Breadcrumb */}
      <nav className="text-xs text-gray-500 flex items-center space-x-2">
        <Link to="/customer" className="hover:text-[#C62828]">Home</Link>
        <span>/</span>
        <Link to="/customer/shop" className="hover:text-[#C62828]">Shop</Link>
        <span>/</span>
        {product.category && (
          <>
            <span className="text-gray-400">{product.category.categoryName}</span>
            <span>/</span>
          </>
        )}
        <span className="text-gray-800 font-medium truncate max-w-xs">{product.productName}</span>
      </nav>

      {/* Main Product Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm">
        {/* Left: Image Gallery */}
        <div className="flex flex-col space-y-4">
          {/* Main Selected Image */}
          <div className="relative w-full aspect-square bg-[#FFF9F9] rounded-xl overflow-hidden border border-gray-100 flex items-center justify-center">
            {selectedImage ? (
              <img
                src={selectedImage}
                alt={product.productName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className={`w-full h-full items-center justify-center text-gray-400 text-sm font-medium ${
                selectedImage ? 'hidden' : 'flex'
              }`}
            >
              No Image Available
            </div>
          </div>

          {/* Thumbnail Row if Multiple Images */}
          {product.productImages && product.productImages.length > 1 && (
            <div className="flex space-x-3 overflow-x-auto pb-2">
              {product.productImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition shrink-0 ${
                    selectedImage === img ? 'border-[#C62828]' : 'border-gray-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Info & Actions */}
        <div className="flex flex-col">
          {/* Category & Diet Badges */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {product.category && (
              <span className="text-xs font-bold uppercase tracking-wider text-[#C62828]">
                {product.category.categoryName}
              </span>
            )}
            {product.productRange === 'diet' && (
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-black uppercase tracking-wider rounded-md inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                <span>Diet</span>
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
            {product.productName}
          </h1>

          {/* Rating & Review Count */}
          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
            <div className="flex items-center text-amber-500 font-bold">
              ★ {product.averageRating || 0}
            </div>
            <span>•</span>
            <span className="text-gray-500">
              {product.reviewCount || 0} customer review{product.reviewCount === 1 ? '' : 's'}
            </span>
          </div>

          {/* Price & Stock Status */}
          <div className="p-4 bg-[#FFF9F9] rounded-2xl border border-gray-100 mb-6 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs text-gray-500">
                  {selectedVariant?.discountAmount > 0 ? 'Offer Price' : 'Selling Price'}
                </span>
                {selectedVariant?.offerName && (
                  <span className="px-2 py-0.5 bg-[#C62828] text-white text-[10px] font-black uppercase tracking-wider rounded-md">
                    {selectedVariant.discountType === 'percentage'
                      ? `${selectedVariant.discountValue}% OFF • ${selectedVariant.offerName}`
                      : `₹${selectedVariant.discountValue} OFF • ${selectedVariant.offerName}`}
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#C62828]">
                  {selectedVariant
                    ? `₹${typeof selectedVariant.finalPrice === 'number' ? selectedVariant.finalPrice : selectedVariant.sellingPrice}`
                    : 'Select Variant'}
                </span>
                {selectedVariant?.discountAmount > 0 && (
                  <span className="text-sm font-semibold text-gray-400 line-through">
                    ₹{selectedVariant.sellingPrice}
                  </span>
                )}
              </div>
            </div>

            {/* Stock status badge */}
            <div>
              {isOutOfStock ? (
                <span className="px-3.5 py-1.5 bg-red-100 text-[#C62828] text-xs font-bold rounded-full">
                  Out of Stock
                </span>
              ) : isLowStock ? (
                <span className="px-3.5 py-1.5 bg-amber-100 text-[#BA7517] text-xs font-bold rounded-full">
                  Low Stock
                </span>
              ) : (
                <span className="px-3.5 py-1.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                  In Stock
                </span>
              )}
            </div>
          </div>

          {/* Variant Selector */}
          <div className="mb-6">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block mb-2">
              Select Pack Size / Weight
            </label>
            <div className="flex flex-wrap gap-2.5">
              {product.variants?.map((v) => {
                const isSelected = selectedVariant?._id === v._id;
                const outStock = v.stockStatus === 'out_of_stock';
                const displayPrice = typeof v.finalPrice === 'number' ? v.finalPrice : v.sellingPrice;
                return (
                  <button
                    key={v._id}
                    type="button"
                    onClick={() => setSelectedVariant(v)}
                    className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition cursor-pointer ${
                      isSelected
                        ? 'bg-[#C62828] text-white shadow-sm'
                        : 'bg-white border border-[#FDECEC] text-[#8E1B1B] hover:bg-[#FDECEC]'
                    } ${outStock ? 'opacity-50' : ''}`}
                  >
                    <span>{v.displayName || `${v.weight}${v.unit}`}</span>
                    <span className="text-xs ml-1.5 opacity-90">
                      (₹{displayPrice}
                      {v.discountAmount > 0 && (
                        <span className="line-through ml-1 opacity-70">₹{v.sellingPrice}</span>
                      )}
                      )
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="mb-6">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block mb-2">
              Quantity
            </label>
            <div className="flex items-center space-x-3">
              <div className="flex items-center border border-gray-200 rounded-full px-1 py-0.5 bg-white shadow-xs">
                <button
                  type="button"
                  disabled={quantity <= 1 || isOutOfStock}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 font-bold disabled:opacity-30 cursor-pointer"
                >
                  −
                </button>
                <span className="px-3 text-sm font-bold text-gray-800 min-w-[2.5rem] text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  disabled={quantity >= 20 || isOutOfStock}
                  onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 font-bold disabled:opacity-30 cursor-pointer"
                >
                  +
                </button>
              </div>
              <span className="text-xs text-gray-400">Max 20 packs per order</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col space-y-3 mt-auto pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Add to cart */}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock || addingToCart}
                className={`py-3.5 px-6 rounded-xl font-bold text-sm transition shadow-sm cursor-pointer ${
                  isOutOfStock
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-[#C62828] hover:bg-[#8E1B1B] text-white active:scale-98'
                }`}
              >
                {addingToCart ? 'Adding...' : 'Add to Cart'}
              </button>

              {/* Buy now */}
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={isOutOfStock || addingToCart}
                className={`py-3.5 px-6 rounded-xl font-bold text-sm text-white transition shadow-sm cursor-pointer ${
                  isOutOfStock
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-[#8E1B1B] hover:bg-[#701515] active:scale-98'
                }`}
              >
                Buy Now
              </button>
            </div>
          </div>

          {/* Feedback Toast */}
          {actionFeedback && (
            <div
              className={`mt-3 p-2.5 rounded-lg text-xs font-semibold text-center transition ${
                actionFeedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {actionFeedback.message}
            </div>
          )}
        </div>
      </div>

      {/* Stacked Tabs / Sections: Description, Ingredients, Nutrition, Reviews */}
      <div className="mt-10 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
        {/* Tab Headers */}
        <div className="flex space-x-6 border-b border-gray-100 pb-3 overflow-x-auto text-sm font-semibold">
          {[
            { id: 'description', label: 'Description' },
            { id: 'ingredients', label: 'Ingredients' },
            { id: 'nutrition', label: 'Nutritional Info' },
            { id: 'reviews', label: `Reviews (${product.reviews?.length || 0})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-2 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'text-[#C62828] border-b-2 border-[#C62828]'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="py-6 text-sm text-gray-700 leading-relaxed">
          {activeTab === 'description' && (
            <div>
              <p>{product.description || 'No description provided for this product.'}</p>
            </div>
          )}

          {activeTab === 'ingredients' && (
            <div>
              <p>{product.ingredients || 'Ingredients details not specified.'}</p>
            </div>
          )}

          {activeTab === 'nutrition' && (
            <div>
              <p>{product.nutritionalInformation || 'Nutritional information will be updated soon.'}</p>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-4">
              {product.reviews && product.reviews.length > 0 ? (
                product.reviews.map((rev) => (
                  <div key={rev._id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-gray-800">
                        {rev.user?.name || 'Customer'}
                      </span>
                      <span className="text-amber-500 font-bold">★ {rev.rating}</span>
                    </div>
                    <p className="text-gray-600 text-xs sm:text-sm mt-1">{rev.comment}</p>
                    <span className="text-[11px] text-gray-400 block mt-2">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))
              ) : (
                <EmptyState message="No reviews yet for this product." />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
