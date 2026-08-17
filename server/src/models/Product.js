import mongoose from "mongoose";

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
  },
  { _id: false },
);

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
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    images: [imageSchema], // Cloudinary { url, publicId } pairs — publicId enables real deletion
    variants: [variantSchema],
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true },
);

productSchema.index({ storeId: 1 });
productSchema.index({ storeId: 1, name: "text" });
// Matches the public storefront listing (GET /products): filter by isPublished, sort newest first
productSchema.index({ isPublished: 1, createdAt: -1 });

export default mongoose.model("Product", productSchema);
