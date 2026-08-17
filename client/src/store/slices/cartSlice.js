import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [], // { productId, storeId, name, price, image, quantity, maxStock, variantLabel }
};

function findItemIndex(items, productId, variantLabel) {
  return items.findIndex(
    (i) => i.productId === productId && i.variantLabel === variantLabel,
  );
}

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    /** Adds a product to the cart, or increments quantity if it (with the same variant) is already in there. */
    addItem(state, action) {
      const {
        productId,
        storeId,
        name,
        price,
        image,
        quantity = 1,
        maxStock,
        variantLabel = null,
      } = action.payload;
      const existingIndex = findItemIndex(state.items, productId, variantLabel);

      if (existingIndex !== -1) {
        const nextQty = state.items[existingIndex].quantity + quantity;
        state.items[existingIndex].quantity =
          maxStock ? Math.min(nextQty, maxStock) : nextQty;
      } else {
        state.items.push({
          productId,
          storeId,
          name,
          price,
          image,
          quantity,
          maxStock,
          variantLabel,
        });
      }
    },

    /** Sets an exact quantity (used by the +/- steppers and manual input on the cart page). */
    setQuantity(state, action) {
      const { productId, variantLabel = null, quantity } = action.payload;
      const index = findItemIndex(state.items, productId, variantLabel);
      if (index === -1) return;

      if (quantity <= 0) {
        state.items.splice(index, 1);
      } else {
        const item = state.items[index];
        item.quantity =
          item.maxStock ? Math.min(quantity, item.maxStock) : quantity;
      }
    },

    removeItem(state, action) {
      const { productId, variantLabel = null } = action.payload;
      state.items = state.items.filter(
        (i) => !(i.productId === productId && i.variantLabel === variantLabel),
      );
    },

    clearCart(state) {
      state.items = [];
    },
  },
});

export const { addItem, setQuantity, removeItem, clearCart } =
  cartSlice.actions;

// Selectors — kept alongside the slice so every consumer computes totals the same way.
export const selectCartItems = (state) => state.cart.items;
export const selectCartItemCount = (state) =>
  state.cart.items.reduce((sum, item) => sum + item.quantity, 0);
export const selectCartSubtotal = (state) =>
  state.cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

/** Multiple vendors in one cart complicates checkout (separate PaymentIntents/orders
 * per store) — surfacing this early so the checkout page (Week 3 Day 6-7) can decide
 * how to handle it, e.g. by grouping checkout per store. */
export const selectCartStoreIds = (state) => [
  ...new Set(state.cart.items.map((item) => item.storeId)),
];

export default cartSlice.reducer;
