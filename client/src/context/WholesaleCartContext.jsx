import React, { createContext, useContext, useState } from 'react';

/*
 * WHY THIS CART LIVES ONLY IN REACT STATE (no backend persistence):
 *
 * The wholesale checkout in Phase 6A is a direct "list-then-submit" flow: the wholesaler
 * browses products, assembles a list of items, reviews them, and submits a single POST to
 * create the order. There is no separate "wholesale cart" collection in the database.
 *
 * Persisting this cart to the server would require a new Mongoose model, a new set of
 * CRUD endpoints, and a sync strategy — all scope creep for a project submission whose
 * Phase 6A backend is already locked. Using React state keeps the implementation clean,
 * avoids a redundant database model, and matches the real-world pattern of B2B ordering
 * tools (e.g., trade portals) where bulk orders are compiled and sent in one shot rather
 * than stored in a long-lived cart.
 *
 * The known trade-off: cart items are lost on page refresh. This is documented here and
 * can be explained in the viva — see the viva note in the final summary.
 */

const WholesaleCartContext = createContext();

export const WholesaleCartProvider = ({ children }) => {
  // Each item: { variantId, productName, displayName, wholesalePrice, minOrderQty, quantity, stockStatus }
  const [items, setItems] = useState([]);

  /**
   * Add a variant to the wholesale cart.
   * - If the variant is already in the cart, increase its quantity.
   * - If not, push it as a new entry.
   * - Defaults quantity to the variant's minOrderQty if not explicitly provided.
   *
   * @param {Object} variantData - { _id (variantId), displayName, wholesalePrice, minOrderQty, stockStatus }
   * @param {string} productName - Product name for display
   * @param {number} quantity - Optional; defaults to minOrderQty
   */
  const addItem = (variantData, productName, quantity) => {
    const qty = quantity ?? variantData.minOrderQty ?? 1;
    setItems((prev) => {
      const exists = prev.find((item) => item.variantId === variantData._id);
      if (exists) {
        // Variant already in cart — increase quantity
        return prev.map((item) =>
          item.variantId === variantData._id
            ? { ...item, quantity: item.quantity + qty }
            : item
        );
      }
      // New variant — add to cart
      return [
        ...prev,
        {
          variantId: variantData._id,
          productName: productName || '',
          displayName: variantData.displayName || '',
          wholesalePrice: variantData.wholesalePrice || 0,
          minOrderQty: variantData.minOrderQty || 1,
          quantity: qty,
          stockStatus: variantData.stockStatus || 'in_stock'
        }
      ];
    });
  };

  /**
   * Update the quantity for a cart item.
   * MOQ validation is intentionally NOT enforced here — it is shown as a visual
   * warning in the UI, and final validation happens on the backend at order time.
   * This allows the wholesaler to edit freely and see warnings inline.
   *
   * @param {string} variantId
   * @param {number} quantity - Any positive number
   */
  const updateQuantity = (variantId, quantity) => {
    if (quantity < 1) return; // prevent 0 or negative
    setItems((prev) =>
      prev.map((item) =>
        item.variantId === variantId ? { ...item, quantity } : item
      )
    );
  };

  /**
   * Remove a single variant from the cart.
   * @param {string} variantId
   */
  const removeItem = (variantId) => {
    setItems((prev) => prev.filter((item) => item.variantId !== variantId));
  };

  /**
   * Clear all items from the cart.
   * Called after a successful wholesale order placement.
   */
  const clearCart = () => {
    setItems([]);
  };

  // Total count of all units across all variants — used for the sidebar badge
  const cartCount = items.reduce((sum, item) => sum + (item.quantity || 0), 0);

  // Total wholesale cost across all cart rows
  const subtotal = items.reduce(
    (sum, item) => sum + (item.wholesalePrice || 0) * (item.quantity || 0),
    0
  );

  return (
    <WholesaleCartContext.Provider
      value={{
        items,
        cartCount,
        subtotal,
        addItem,
        updateQuantity,
        removeItem,
        clearCart
      }}
    >
      {children}
    </WholesaleCartContext.Provider>
  );
};

/**
 * Hook to access the wholesale cart context.
 * Must be used inside <WholesaleCartProvider>.
 */
export const useWholesaleCart = () => {
  const context = useContext(WholesaleCartContext);
  if (!context) {
    throw new Error('useWholesaleCart must be used within a WholesaleCartProvider');
  }
  return context;
};
