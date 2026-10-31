import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getProductById } from '../../api/catalogApi.js';
import { getWishlist, addToWishlist, removeFromWishlist } from '../../api/wishlistApi.js';
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
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [actionFeedback, setActionFeedback] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);

  // Load product detail & wishlist status
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

        // Check wishlist status
        try {
          const wishData = await getWishlist();
          const items = wishData?.items || wishData?.wishlist || [];
          const exists = items.some(
            (item) => (item.product ? item.product._id : item.productId) === id
          );
          setIsWishlisted(exists);
        } catch (wErr) {
          // Ignore wishlist check error for anonymous users
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Product not found.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Wishlist toggle handler
  const handleWishlistToggle = async () => {
    try {
      if (isWishlisted) {
        await removeFromWishlist(id);
        setIsWishlisted(false);
        showFeedback('Removed from wishlist');
      } else {
        await addToWishlist(id);
        setIsWishlisted(true);
        showFeedback('Added to wishlist');
      }
    } catch (err) {
      showFeedback('Wishlist update failed', 'error');
    }
  };

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="text-xs text-gray-500 mb-6 flex items-center space-x-2">
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

            {/* Wishlist Heart Button */}
            <button
              onClick={handleWishlistToggle}
              type="button"
              className="absolute top-4 right-4 p-2.5 rounded-full bg-white/90 backdrop-blur-sm shadow hover:bg-white text-[#C62828] transition cursor-pointer"
            >
              {isWishlisted ? (
                <svg className="w-6 h-6 fill-[#C62828]" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 stroke-[#C62828] fill-none" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              )}
            </button>
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
          {/* Category Tag */}
          {product.category && (
            <span className="text-xs font-bold uppercase tracking-wider text-[#C62828] mb-1">
              {product.category.categoryName}
            </span>
          )}

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
          <div className="p-4 bg-[#FFF9F9] rounded-xl border border-gray-100 mb-6 flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-500 block">Selling Price</span>
              <span className="text-2xl sm:text-3xl font-black text-[#C62828]">
                {selectedVariant ? `₹${selectedVariant.sellingPrice}` : 'Select Variant'}
              </span>
            </div>

            {/* Stock status badge */}
            <div>
              {isOutOfStock ? (
                <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                  Out of Stock
                </span>
              ) : isLowStock ? (
                <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">
                  Low Stock
                </span>
              ) : (
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
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
                return (
                  <button
                    key={v._id}
                    onClick={() => setSelectedVariant(v)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold border transition ${
                      isSelected
                        ? 'border-[#C62828] bg-[#FDECEC] text-[#C62828]'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    } ${outStock ? 'opacity-50' : ''}`}
                  >
                    <span>{v.displayName || `${v.weight}${v.unit}`}</span>
                    <span className="text-xs ml-1.5 opacity-80">(₹{v.sellingPrice})</span>
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
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white">
                <button
                  disabled={quantity <= 1 || isOutOfStock}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3.5 py-1.5 text-gray-600 hover:bg-gray-100 font-bold disabled:opacity-40"
                >
                  -
                </button>
                <span className="px-4 py-1.5 text-sm font-bold text-gray-800 min-w-[2.5rem] text-center">
                  {quantity}
                </span>
                <button
                  disabled={quantity >= 20 || isOutOfStock}
                  onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                  className="px-3.5 py-1.5 text-gray-600 hover:bg-gray-100 font-bold disabled:opacity-40"
                >
                  +
                </button>
              </div>
              <span className="text-xs text-gray-400">Max 20 packs per order</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-auto pt-4">
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock || addingToCart}
              className={`py-3 px-6 rounded-xl font-bold text-sm transition shadow-sm ${
                isOutOfStock
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-[#C62828] hover:bg-[#8E1B1B] text-white active:scale-98'
              }`}
            >
              {addingToCart ? 'Adding...' : 'Add to Cart'}
            </button>

            <button
              onClick={handleBuyNow}
              disabled={isOutOfStock || addingToCart}
              className={`py-3 px-6 rounded-xl font-bold text-sm border transition ${
                isOutOfStock
                  ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                  : 'border-[#C62828] text-[#C62828] hover:bg-[#FDECEC] active:scale-98'
              }`}
            >
              Buy Now
            </button>
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
