import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import connectDB from "./config/db.js";
import app from "./app.js";

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`E-Commerce backend running on http://localhost:${PORT}`);
  });

  // Deployment platforms (Render, Docker, k8s) send SIGTERM before killing
  // a container — without handling it, in-flight requests get dropped and
  // the MongoDB connection closes uncleanly. This lets both finish gracefully.
  function shutdown(signal) {
    console.log(`${signal} received, shutting down gracefully...`);
    server.close(async () => {
      console.log("HTTP server closed.");
      await mongoose.connection.close();
      console.log("MongoDB connection closed.");
      process.exit(0);
    });

    // Safety net: if something hangs (a stuck request, a slow query), force
    // exit after 10s rather than leaving the container running forever.
    setTimeout(() => {
      console.error("Forced shutdown after 10s timeout.");
      process.exit(1);
    }, 10_000).unref();
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
});
