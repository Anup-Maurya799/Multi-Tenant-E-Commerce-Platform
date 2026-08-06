import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { selectCartItems, clearCart } from "../../store/slices/cartSlice";
import orderService from "../../services/orderService";
import PaymentForm from "../../components/checkout/PaymentForm";

/** Groups flat cart items into one array of items per storeId — a single
 * order can only belong to one store (enforced server-side too). */
function groupItemsByStore(cartItems) {
  const groups = new Map();
  for (const item of cartItems) {
    if (!groups.has(item.storeId)) groups.set(item.storeId, []);
    groups.get(item.storeId).push(item);
  }
  return [...groups.entries()].map(([storeId, items]) => ({ storeId, items }));
}

function CheckoutPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cartItems = useSelector(selectCartItems);

  // "creating" | "paying" | "done"
  const [phase, setPhase] = useState("creating");
  const [pendingOrders, setPendingOrders] = useState([]); // [{ storeId, order, clientSecret }]
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState("");

  // Create one order (+ PaymentIntent) per store, up front, before showing any payment form.
  useEffect(() => {
    if (cartItems.length === 0) return;

    const storeGroups = groupItemsByStore(cartItems);
    let cancelled = false;

    Promise.all(
      storeGroups.map(async ({ storeId, items }) => {
        const data = await orderService.createOrder({
          storeId,
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            variantLabel: i.variantLabel || undefined,
          })),
        });
        return { storeId, order: data.order, clientSecret: data.clientSecret };
      }),
    )
      .then((results) => {
        if (cancelled) return;
        setPendingOrders(results);
        setPhase("paying");
      })
      .catch((errorMessage) => {
        if (cancelled) return;
        setError(errorMessage);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally runs once with the cart snapshot at mount
  }, []);

  const handleOrderPaid = () => {
    if (currentIndex + 1 < pendingOrders.length) {
      setCurrentIndex((i) => i + 1);
    } else {
      dispatch(clearCart());
      setPhase("done");
      navigate("/order-confirmation", {
        state: { orders: pendingOrders.map((p) => p.order) },
        replace: true,
      });
    }
  };

  if (cartItems.length === 0 && phase !== "done") {
    return (
      <div className="max-w-lg mx-auto bg-white rounded-xl border border-sky-100 p-10 text-center text-sm text-slate-500">
        Your cart is empty.
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto">
        <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      </div>
    );
  }

  if (phase === "creating") {
    return (
      <div className="max-w-lg mx-auto bg-white rounded-xl border border-sky-100 p-10 text-center text-sm text-slate-500">
        Preparing your order...
      </div>
    );
  }

  const current = pendingOrders[currentIndex];

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-slate-800 mb-1">Checkout</h1>
      {pendingOrders.length > 1 && (
        <p className="text-sm text-slate-500 mb-6">
          Order {currentIndex + 1} of {pendingOrders.length} (one per vendor)
        </p>
      )}
      {pendingOrders.length === 1 && <div className="mb-6" />}

      <div className="bg-white rounded-xl border border-sky-100 p-5 mb-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">
          Order summary
        </h2>
        <div className="space-y-1.5 mb-3">
          {current.order.items.map((item, i) => (
            <div
              key={i}
              className="flex justify-between text-sm text-slate-600"
            >
              <span>
                {item.name}
                {item.variantLabel ? ` (${item.variantLabel})` : ""} x
                {item.quantity}
              </span>
              <span>${(item.unitPrice * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-sm font-semibold text-slate-800 pt-2 border-t border-sky-50">
          <span>Total</span>
          <span>${current.order.totalAmount.toFixed(2)}</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-sky-100 p-5">
        <PaymentForm
          order={current.order}
          clientSecret={current.clientSecret}
          onSuccess={handleOrderPaid}
        />
      </div>
    </div>
  );
}

export default CheckoutPage;
