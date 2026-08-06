import React, { useState } from "react";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { FaLock } from "react-icons/fa";
import { getStripe } from "../../lib/stripe";
import orderService from "../../services/orderService";

const IS_MOCK_MODE = import.meta.env.VITE_USE_MOCK_API === "true";

/** Inner form — must render inside <Elements> to access useStripe/useElements. */
function StripeInnerForm({ order, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return; // Stripe.js hasn't finished loading yet

    setIsSubmitting(true);
    setError("");

    // redirect: 'if_required' keeps the customer on this page for payment
    // methods that don't need a redirect (e.g. plain card) — only methods
    // that genuinely require leaving the page (some bank redirects) will navigate away.
    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/order-confirmation`,
      },
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message || "Payment failed. Please try again.");
      setIsSubmitting(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      onSuccess();
    } else {
      // Some payment methods land in a pending/processing state — the
      // webhook will finalize the order server-side once it settles.
      setError(
        "Your payment is processing. We'll confirm your order by email shortly.",
      );
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={!stripe || isSubmitting}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white font-semibold py-2.5 text-sm transition-colors shadow-sm shadow-sky-200"
      >
        {isSubmitting && (
          <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        )}
        <FaLock size={12} />
        {isSubmitting ?
          "Processing..."
        : `Pay $${order.totalAmount.toFixed(2)}`}
      </button>
    </form>
  );
}

/** Demo-mode stand-in — real Stripe can't process a fake clientSecret,
 * so this simulates "the webhook just confirmed payment" for demo purposes. */
function MockPaymentForm({ order, onSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSimulate = async () => {
    setIsSubmitting(true);
    setError("");
    try {
      await orderService.simulateMockPayment(order._id);
      onSuccess();
    } catch (errorMessage) {
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
        Demo mode — no real payment form or card details needed. Clicking below
        simulates Stripe confirming this payment.
      </p>
      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      <button
        onClick={handleSimulate}
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white font-semibold py-2.5 text-sm transition-colors shadow-sm shadow-sky-200"
      >
        {isSubmitting && (
          <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        )}
        <FaLock size={12} />
        {isSubmitting ?
          "Simulating..."
        : `Simulate payment of $${order.totalAmount.toFixed(2)}`}
      </button>
    </div>
  );
}

/**
 * Public component used by CheckoutPage — picks the real or mock form
 * based on the same VITE_USE_MOCK_API flag used everywhere else in the app.
 */
function PaymentForm({ order, clientSecret, onSuccess }) {
  if (IS_MOCK_MODE) {
    return <MockPaymentForm order={order} onSuccess={onSuccess} />;
  }

  return (
    <Elements stripe={getStripe()} options={{ clientSecret }}>
      <StripeInnerForm order={order} onSuccess={onSuccess} />
    </Elements>
  );
}

export default PaymentForm;
