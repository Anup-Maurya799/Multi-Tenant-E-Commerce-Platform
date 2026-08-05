import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "sk_test_dummy";

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2024-06-20",
});

export default stripe;
