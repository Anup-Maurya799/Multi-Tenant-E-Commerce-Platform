import { loadStripe } from "@stripe/stripe-js";

let stripePromise;

/** Loads Stripe.js once and caches the promise — call this only from real
 * (non-mock) checkout paths, since it reaches out to js.stripe.com. */
export function getStripe() {
  if (!stripePromise) {
    stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
}
