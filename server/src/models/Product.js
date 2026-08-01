import mongoose from "mongoose";

const variantSchema = new mongoose.Schema(
  {
    size: { type: String, trim: true },
    color: { type: String, trim: true },
    stock: { type: Number, default: 0, min: 0 },
    priceOverride: { type: Number, min: 0 },
  },
  { _id: false },
);

const productSchema = new mongoose.Schema(
  {
    // Tenant-isolation key — every product query must filter by this.
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        publicId: {
          type: String,
          required: true,
        },
      },
    ],
    variants: [variantSchema],
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true },
);

productSchema.index({ storeId: 1 });
productSchema.index({ storeId: 1, name: "text" });

export default mongoose.model("Product", productSchema);
