import { describe, test, expect } from "vitest";
import cartReducer, {
  addItem,
  setQuantity,
  removeItem,
  clearCart,
  selectCartItemCount,
  selectCartSubtotal,
  selectCartStoreIds,
} from "../../src/store/slices/cartSlice";

const baseItem = {
  productId: "p1",
  storeId: "store1",
  name: "Lavender Candle",
  price: 20,
  image: "img.jpg",
  quantity: 1,
  maxStock: 5,
  variantLabel: null,
};

describe("cartSlice reducer", () => {
  test("addItem adds a new item to an empty cart", () => {
    const state = cartReducer(undefined, addItem(baseItem));
    expect(state.items).toHaveLength(1);
    expect(state.items[0].quantity).toBe(1);
  });

  test("addItem increments quantity when the same product+variant is added again", () => {
    let state = cartReducer(undefined, addItem(baseItem));
    state = cartReducer(state, addItem({ ...baseItem, quantity: 2 }));
    expect(state.items).toHaveLength(1);
    expect(state.items[0].quantity).toBe(3);
  });

  test("addItem treats different variantLabels of the same product as separate line items", () => {
    let state = cartReducer(
      undefined,
      addItem({ ...baseItem, variantLabel: "Small" }),
    );
    state = cartReducer(state, addItem({ ...baseItem, variantLabel: "Large" }));
    expect(state.items).toHaveLength(2);
  });

  test("addItem caps quantity at maxStock even across multiple adds", () => {
    let state = cartReducer(
      undefined,
      addItem({ ...baseItem, quantity: 3, maxStock: 5 }),
    );
    state = cartReducer(
      state,
      addItem({ ...baseItem, quantity: 10, maxStock: 5 }),
    );
    expect(state.items[0].quantity).toBe(5); // capped, not 13
  });

  test("setQuantity updates an existing item's quantity", () => {
    let state = cartReducer(undefined, addItem(baseItem));
    state = cartReducer(state, setQuantity({ productId: "p1", quantity: 4 }));
    expect(state.items[0].quantity).toBe(4);
  });

  test("setQuantity removes the item entirely when set to 0 or below", () => {
    let state = cartReducer(undefined, addItem(baseItem));
    state = cartReducer(state, setQuantity({ productId: "p1", quantity: 0 }));
    expect(state.items).toHaveLength(0);
  });

  test("setQuantity respects maxStock", () => {
    let state = cartReducer(undefined, addItem({ ...baseItem, maxStock: 5 }));
    state = cartReducer(state, setQuantity({ productId: "p1", quantity: 99 }));
    expect(state.items[0].quantity).toBe(5);
  });

  test("removeItem removes only the matching product+variant", () => {
    let state = cartReducer(
      undefined,
      addItem({ ...baseItem, variantLabel: "Small" }),
    );
    state = cartReducer(state, addItem({ ...baseItem, variantLabel: "Large" }));
    state = cartReducer(
      state,
      removeItem({ productId: "p1", variantLabel: "Small" }),
    );
    expect(state.items).toHaveLength(1);
    expect(state.items[0].variantLabel).toBe("Large");
  });

  test("clearCart empties the cart entirely", () => {
    let state = cartReducer(undefined, addItem(baseItem));
    state = cartReducer(state, clearCart());
    expect(state.items).toHaveLength(0);
  });
});

describe("cartSlice selectors", () => {
  function fakeRootState(items) {
    return { cart: { items } };
  }

  test("selectCartItemCount sums quantities across all line items", () => {
    const state = fakeRootState([
      { ...baseItem, quantity: 2 },
      { ...baseItem, productId: "p2", quantity: 3 },
    ]);
    expect(selectCartItemCount(state)).toBe(5);
  });

  test("selectCartSubtotal multiplies price by quantity and sums", () => {
    const state = fakeRootState([
      { ...baseItem, price: 10, quantity: 2 }, // 20
      { ...baseItem, productId: "p2", price: 5, quantity: 3 }, // 15
    ]);
    expect(selectCartSubtotal(state)).toBe(35);
  });

  test("selectCartStoreIds returns each distinct store exactly once", () => {
    const state = fakeRootState([
      { ...baseItem, storeId: "storeA" },
      { ...baseItem, productId: "p2", storeId: "storeA" },
      { ...baseItem, productId: "p3", storeId: "storeB" },
    ]);
    expect(selectCartStoreIds(state).sort()).toEqual(["storeA", "storeB"]);
  });
});
