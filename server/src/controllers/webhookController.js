import stripe from "../config/stripe.js";
import { handleStripeWebhookEvent } from "../services/order.service.js";

/**
 * Stripe signs each webhook payload using the RAW request bytes — if
 * express.json() has already parsed/re-serialized the body, the signature
 * check fails even for a legitimate event. That's why app.js mounts
 * express.raw() for this exact path before the global express.json().
 */
export async function stripeWebhook(req, res) {
  const signature = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    await handleStripeWebhookEvent(event);
    // 200 tells Stripe "received and processed" — it stops retrying this event.
    res.json({ received: true });
  } catch (err) {
    console.error("Error handling Stripe webhook event:", err);
    // 500 (not 200) here on purpose: if OUR handling failed, we want Stripe
    // to retry the event later rather than silently losing it.
    res.status(500).json({ message: "Webhook handler failed." });
  }
}
