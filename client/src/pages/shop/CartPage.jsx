import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FaTrash, FaShoppingBag } from "react-icons/fa";
import {
  selectCartItems,
  selectCartSubtotal,
  selectCartStoreIds,
  setQuantity,
  removeItem,
} from "../../store/slices/cartSlice";
import useAuth from "../../hooks/useAuth";

function CartPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const items = useSelector(selectCartItems);
  const subtotal = useSelector(selectCartSubtotal);
  const storeIds = useSelector(selectCartStoreIds);
  const { isAuthenticated } = useAuth();

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: { pathname: "/cart" } } });
      return;
    }
    // Checkout page (Stripe payment flow) is being built next — see chat.
    navigate("/checkout");
  };

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-xl border border-sky-100 p-10 text-center">
        <FaShoppingBag className="mx-auto text-sky-300 mb-3" size={32} />
        <p className="text-slate-600 font-medium">Your cart is empty</p>
        <p className="text-sm text-slate-500 mt-1 mb-4">
          Browse the shop to find something you like.
        </p>
        <Link
          to="/shop"
          className="inline-block rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold px-4 py-2.5 transition-colors"
        >
          Go to shop
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-xl font-bold text-slate-800 mb-6">Your Cart</h1>

      {storeIds.length > 1 && (
        <p className="text-sm text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-4">
          Your cart has items from {storeIds.length} different vendors. Checkout
          will process them as separate orders.
        </p>
      )}

      <div className="bg-white rounded-xl border border-sky-100 divide-y divide-sky-50 mb-6">
        {items.map((item) => (
          <div
            key={`${item.productId}-${item.variantLabel}`}
            className="flex items-center gap-4 p-4"
          >
            <div className="h-16 w-16 rounded-lg bg-sky-50 overflow-hidden flex-shrink-0">
              {item.image && (
                <img
                  src={item.image}
                  alt=""
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-slate-700 truncate">{item.name}</p>
              <p className="text-sm text-slate-500">
                ${item.price.toFixed(2)} each
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  dispatch(
                    setQuantity({
                      productId: item.productId,
                      variantLabel: item.variantLabel,
                      quantity: item.quantity - 1,
                    }),
                  )
                }
                className="h-7 w-7 rounded-lg border border-sky-200 text-slate-500 hover:bg-sky-50 flex items-center justify-center"
              >
                −
              </button>
              <span className="w-6 text-center text-sm">{item.quantity}</span>
              <button
                onClick={() =>
                  dispatch(
                    setQuantity({
                      productId: item.productId,
                      variantLabel: item.variantLabel,
                      quantity: item.quantity + 1,
                    }),
                  )
                }
                disabled={
                  item.maxStock ? item.quantity >= item.maxStock : false
                }
                className="h-7 w-7 rounded-lg border border-sky-200 text-slate-500 hover:bg-sky-50 disabled:opacity-40 flex items-center justify-center"
              >
                +
              </button>
            </div>
            <p className="w-16 text-right text-sm font-semibold text-slate-700">
              ${(item.price * item.quantity).toFixed(2)}
            </p>
            <button
              onClick={() =>
                dispatch(
                  removeItem({
                    productId: item.productId,
                    variantLabel: item.variantLabel,
                  }),
                )
              }
              className="text-slate-300 hover:text-red-500 transition-colors"
              aria-label={`Remove ${item.name}`}
            >
              <FaTrash size={13} />
            </button>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-sky-100 p-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">Subtotal</p>
          <p className="text-xl font-bold text-slate-800">
            ${subtotal.toFixed(2)}
          </p>
        </div>
        <button
          onClick={handleCheckout}
          className="rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-semibold px-6 py-2.5 text-sm transition-colors shadow-sm shadow-sky-200"
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}

export default CartPage;
