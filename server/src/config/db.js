import mongoose from "mongoose";

/**
 * Single place that owns the MongoDB connection. Called once from
 * server.js on boot — nothing else in the app should call mongoose.connect.
 */
async function connectDB() {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
}

export default connectDB;
