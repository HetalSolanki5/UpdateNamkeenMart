import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext.jsx';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart
} from '../api/cartApi.js';

const CartContext = createContext();

const initialCartState = {
  items: [],
  subtotal: 0,
  deliveryCharge: 0,
  total: 0
};

export const CartProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [cart, setCart] = useState(initialCartState);
  const [loading, setLoading] = useState(false);

  // Helper to check if current logged-in user is a customer
  const isCustomer = user && user.role === 'customer' && Boolean(token);

  // Fetch cart data from the server
  const refreshCart = useCallback(async () => {
    if (!isCustomer) {
      setCart(initialCartState);
      return;
    }

    try {
      setLoading(true);
      const data = await getCart();
      setCart(data || initialCartState);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setLoading(false);
    }
  }, [isCustomer]);

  // Synchronize cart whenever user or auth status changes
  useEffect(() => {
    if (isCustomer) {
      refreshCart();
    } else {
      setCart(initialCartState);
    }
  }, [isCustomer, refreshCart]);

  // Add an item to cart
  const addItem = async (variantId, quantity = 1) => {
    if (!isCustomer) {
      return { success: false, error: 'Please log in as a customer to add items to cart.' };
    }
    try {
      const updated = await addToCart(variantId, quantity);
      if (updated) {
        setCart(updated);
      } else {
        await refreshCart();
      }
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to add item to cart.';
      return { success: false, error: message };
    }
  };

  // Update item quantity
  const updateItem = async (itemId, quantity) => {
    if (!isCustomer) {
      return { success: false, error: 'Not logged in.' };
    }
    try {
      const updated = await updateCartItem(itemId, quantity);
      if (updated) {
        setCart(updated);
      } else {
        await refreshCart();
      }
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update cart item.';
      return { success: false, error: message };
    }
  };

  // Remove a specific cart item
  const removeItem = async (itemId) => {
    if (!isCustomer) {
      return { success: false, error: 'Not logged in.' };
    }
    try {
      const updated = await removeCartItem(itemId);
      if (updated) {
        setCart(updated);
      } else {
        await refreshCart();
      }
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to remove cart item.';
      return { success: false, error: message };
    }
  };

  // Clear entire cart
  const clearCartItems = async () => {
    if (!isCustomer) {
      return { success: false, error: 'Not logged in.' };
    }
    try {
      const updated = await clearCart();
      if (updated) {
        setCart(updated);
      } else {
        setCart(initialCartState);
      }
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to clear cart.';
      return { success: false, error: message };
    }
  };

  // Total count of all items in cart for navbar badge
  const cartCount = cart?.items
    ? cart.items.reduce((sum, item) => sum + (item.quantity || 0), 0)
    : 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        cartCount,
        refreshCart,
        addItem,
        updateItem,
        removeItem,
        clearCartItems
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
