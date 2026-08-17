import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import authRoutes from "./routes/authRoutes.js";
import storeRoutes from "./routes/storeRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);

// IMPORTANT: this must be registered BEFORE express.json() below. Stripe
// signs webhook payloads using the exact raw bytes of the request body —
// if express.json() parses it first, signature verification in
// webhookController.js will fail even for genuine Stripe events.
app.use("/api/v1/webhooks/stripe", express.raw({ type: "application/json" }));

app.use(express.json());
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

app.get("/api/v1/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/stores", storeRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/webhooks", webhookRoutes);
app.use("/api/v1/analytics", analyticsRoutes);

// Deployment/CI (Week 4 Day 6-7) doesn't add routes — see project docs instead.

app.use(notFound);
app.use(errorHandler);

export default app;
