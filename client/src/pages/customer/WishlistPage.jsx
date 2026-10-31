import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getWishlist, removeFromWishlist } from '../../api/wishlistApi.js';
import { getProductById } from '../../api/catalogApi.js';
import { useCart } from '../../context/CartContext.jsx';
import Loader from '../../components/Loader.jsx';
import EmptyState from '../../components/EmptyState.jsx';

const WishlistPage = () => {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [movingId, setMovingId] = useState(null);

  const fetchWishlistItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getWishlist();
      const wishlistList = data?.items || data?.wishlist || [];
      setItems(wishlistList);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load wishlist.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlistItems();
  }, []);

  const showToast = (message, type = 'success') => {
    setActionMessage({ message, type });
    setTimeout(() => {
      setActionMessage(null);
    }, 2500);
  };

  // Remove from Wishlist
  const handleRemove = async (productId) => {
    try {
      await removeFromWishlist(productId);
      setItems((prev) =>
        prev.filter((item) => (item.product ? item.product._id : item.productId) !== productId)
      );
      showToast('Removed from wishlist');
    } catch (err) {
      showToast('Failed to remove item', 'error');
    }
  };

  // Move to Cart: add first active in-stock variant to cart, remove from wishlist
  const handleMoveToCart = async (productId) => {
    setMovingId(productId);
    try {
      // Fetch product to get active in-stock variant
      const prodRes = await getProductById(productId);
      const product = prodRes?.product || prodRes;
      const targetVariant =
        product?.variants?.find((v) => v.stockStatus !== 'out_of_stock') ||
        product?.variants?.[0];

      if (!targetVariant) {
        showToast('No active variant found for this product', 'error');
        setMovingId(null);
        return;
      }

      const cartRes = await addItem(targetVariant._id, 1);
      if (cartRes.success) {
        await removeFromWishlist(productId);
        setItems((prev) =>
          prev.filter((item) => (item.product ? item.product._id : item.productId) !== productId)
        );
        showToast('Moved to cart!');
      } else {
        showToast(cartRes.error || 'Failed to add to cart', 'error');
      }
    } catch (err) {
      showToast('Error moving item to cart', 'error');
    } finally {
      setMovingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            My Wishlist
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Saved namkeens you want to purchase later.
          </p>
        </div>
        <Link
          to="/customer/shop"
          className="text-xs sm:text-sm font-semibold text-[#C62828] hover:text-[#8E1B1B] transition underline"
        >
          Continue Shopping &rarr;
        </Link>
      </div>

      {/* Toast feedback */}
      {actionMessage && (
        <div
          className={`mb-4 p-3 rounded-lg text-xs font-semibold text-center transition ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {actionMessage.message}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <Loader message="Loading your wishlist..." />
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm text-center">
          {error}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          message="Your wishlist is empty."
          actionLabel="Explore Products"
          onAction={() => navigate('/customer/shop')}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => {
            const product = item.product || {};
            const productId = product._id || item.productId;
            const imageSrc = product.productImages?.[0] || null;

            return (
              <div
                key={item._id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition"
              >
                {/* Product Image */}
                <div
                  onClick={() => navigate(`/customer/product/${productId}`)}
                  className="w-full aspect-video sm:aspect-square bg-[#FFF9F9] relative cursor-pointer overflow-hidden flex items-center justify-center"
                >
                  {imageSrc ? (
                    <img
                      src={imageSrc}
                      alt={product.productName}
                      className="w-full h-full object-cover hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <span className="text-gray-400 text-xs font-medium">No Image</span>
                  )}
                </div>

                {/* Info */}
                <div className="p-4 flex flex-col flex-1">
                  <h3
                    onClick={() => navigate(`/customer/product/${productId}`)}
                    className="font-bold text-gray-800 text-base line-clamp-1 hover:text-[#C62828] cursor-pointer transition-colors"
                  >
                    {product.productName}
                  </h3>

                  <div className="mt-2 mb-4">
                    <span className="text-sm font-extrabold text-[#C62828]">
                      {product.price !== null && product.price !== undefined
                        ? `From ₹${product.price}`
                        : 'View Details'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="mt-auto pt-3 border-t border-gray-100 flex items-center space-x-2">
                    <button
                      disabled={movingId === productId}
                      onClick={() => handleMoveToCart(productId)}
                      className="flex-1 py-2 px-3 bg-[#C62828] hover:bg-[#8E1B1B] text-white text-xs font-semibold rounded-lg transition disabled:opacity-50"
                    >
                      {movingId === productId ? 'Moving...' : 'Move to Cart'}
                    </button>
                    <button
                      onClick={() => handleRemove(productId)}
                      className="py-2 px-3 border border-gray-200 text-gray-600 hover:text-red-600 hover:border-red-200 text-xs font-semibold rounded-lg transition"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WishlistPage;
