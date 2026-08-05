import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: { type: String, required: true },
    variantLabel: { type: String, default: null }, // e.g. "Large / Red" — null means base product, no variant
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    items: [orderItemSchema],
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: [
        "pending",
        "paid",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      default: "pending",
    },
    stripePaymentIntentId: { type: String, default: null },
  },
  { timestamps: true },
);

// Matches getVendorOrders + every analytics aggregation ($match on storeId+status, sorted by createdAt)
orderSchema.index({ storeId: 1, status: 1, createdAt: -1 });
// Matches getMyOrders (a customer's own order history, newest first)
orderSchema.index({ customer: 1, createdAt: -1 });

export default mongoose.model("Order", orderSchema);
