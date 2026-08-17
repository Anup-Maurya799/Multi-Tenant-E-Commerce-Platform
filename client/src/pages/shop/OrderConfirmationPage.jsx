import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FaCheckCircle } from "react-icons/fa";

function OrderConfirmationPage() {
  const location = useLocation();
  const orders = location.state?.orders || [];

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-xl border border-sky-100 p-8 text-center">
        <FaCheckCircle className="mx-auto text-sky-500 mb-4" size={44} />
        <h1 className="text-xl font-bold text-slate-800">
          Thank you for your order!
        </h1>
        <p className="text-sm text-slate-500 mt-1 mb-6">
          A confirmation email is on its way. You can also track your order
          status any time.
        </p>

        {orders.length === 0 ?
          <p className="text-sm text-slate-400 mb-6">
            (Order details aren't available here if you refreshed this page —
            check your email or order history instead.)
          </p>
        : <div className="space-y-3 mb-6 text-left">
            {orders.map((order) => (
              <div key={order._id} className="bg-sky-50 rounded-lg p-3 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Order #{order._id.slice(-8)}</span>
                  <span className="font-semibold text-slate-800">
                    Rs.{order.totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        }

        <Link
          to="/shop"
          className="inline-block rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-semibold px-5 py-2.5 text-sm transition-colors shadow-sm shadow-sky-200"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}

export default OrderConfirmationPage;
