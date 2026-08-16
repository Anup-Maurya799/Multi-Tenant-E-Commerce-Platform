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

/*
 * Demo mode is controlled by:
 *
 * VITE_USE_MOCK_API=true
 *
 * in client/.env
 */
const IS_MOCK_MODE = import.meta.env.VITE_USE_MOCK_API === "true";

/*
 * Real Stripe payment form.
 * This is used only when mock mode is disabled.
 */
function StripeInnerForm({ order, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsSubmitting(true);
    setError("");

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
        : `Pay Rs.${order.totalAmount.toFixed(2)}`}
      </button>
    </form>
  );
}

/*
 * Demo payment form.
 *
 * No Stripe account.
 * No Stripe card.
 * No Stripe clientSecret.
 *
 * It calls our backend demo endpoint and marks
 * the order as paid.
 */
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
      setError(errorMessage || "Unable to process demo payment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-3">
        <p className="font-semibold mb-1">Demo Payment Mode</p>

        <p>
          No real payment will be processed. Click the button below to simulate
          a successful payment.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleSimulate}
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white font-semibold py-2.5 text-sm transition-colors shadow-sm shadow-sky-200"
      >
        {isSubmitting && (
          <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        )}

        <FaLock size={12} />

        {isSubmitting ?
          "Processing..."
        : `Simulate payment of Rs.${order.totalAmount.toFixed(2)}`}
      </button>
    </div>
  );
}

/*
 * Main PaymentForm.
 *
 * Mock mode:
 *     MockPaymentForm
 *
 * Real mode:
 *     Stripe Elements
 */
function PaymentForm({ order, clientSecret, onSuccess }) {
  /*
   * MOCK MODE
   */
  if (IS_MOCK_MODE) {
    return <MockPaymentForm order={order} onSuccess={onSuccess} />;
  }

  /*
   * REAL STRIPE MODE
   */
  if (!clientSecret) {
    return (
      <div className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
        Stripe payment is not configured correctly. Please check your Stripe
        configuration.
      </div>
    );
  }

  return (
    <Elements
      stripe={getStripe()}
      options={{
        clientSecret,
      }}
    >
      <StripeInnerForm order={order} onSuccess={onSuccess} />
    </Elements>
  );
}

export default PaymentForm;
