import { loadStripe } from "@stripe/stripe-js";

/**
 * Loads Stripe.js only once for the whole application.
 */

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!publishableKey) {
  console.warn(
    "VITE_STRIPE_PUBLISHABLE_KEY is not defined. Stripe payments will not work until it is added to your .env file.",
  );
}

let stripePromise = null;

export function getStripe() {
  if (!stripePromise) {
    stripePromise = loadStripe(publishableKey || "");
  }

  return stripePromise;
}
