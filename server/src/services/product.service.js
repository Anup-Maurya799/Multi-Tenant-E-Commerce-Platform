import Product from "../models/Product.js";
import { ApiError } from "../utils/ApiError.js";
import {
  uploadBufferToCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinaryUpload.js";

/** Every vendor mutation is scoped to req.user.storeId — never trust a storeId from the client body. */
export async function createProduct(vendorUser, payload) {
  if (!vendorUser.storeId) {
    throw new ApiError(400, "You must create a store before adding products.");
  }

  const product = await Product.create({
    ...payload,
    storeId: vendorUser.storeId,
  });

  return product;
}

/**
 * Public product listing — supports pagination, text search, and filtering
 * by store (for a storefront page). Only published products are returned
 * unless the caller is the owning vendor (handled by getMyProducts instead).
 */
export async function listProducts({ page = 1, limit = 20, search, storeId }) {
  const filter = { isPublished: true };
  if (storeId) filter.storeId = storeId;
  if (search) filter.$text = { $search: search };

  const skip = (page - 1) * limit;
  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Product.countDocuments(filter),
  ]);

  return {
    products,
    total,
    page: Number(page),
    pages: Math.ceil(total / limit),
  };
}

/** Vendor's own product list — includes unpublished/out-of-stock items they own. */
export async function listMyProducts(vendorUser, { page = 1, limit = 20 }) {
  if (!vendorUser.storeId) {
    throw new ApiError(400, "You don't have a store yet.");
  }

  const filter = { storeId: vendorUser.storeId };
  const skip = (page - 1) * limit;
  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Product.countDocuments(filter),
  ]);

  return {
    products,
    total,
    page: Number(page),
    pages: Math.ceil(total / limit),
  };
}

export async function getProductById(productId, requestingUser) {
  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, "Product not found.");
  }

  const isOwner =
    requestingUser &&
    product.storeId.toString() === requestingUser.storeId?.toString();
  if (
    !product.isPublished &&
    !isOwner &&
    requestingUser?.role !== "superadmin"
  ) {
    throw new ApiError(404, "Product not found.");
  }

  return product;
}

/** Tenant isolation enforced here: a vendor can only touch products under their own storeId. */
export async function updateProduct(requestingUser, productId, updates) {
  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, "Product not found.");
  }

  const isOwner =
    product.storeId.toString() === requestingUser.storeId?.toString();
  if (!isOwner && requestingUser.role !== "superadmin") {
    throw new ApiError(403, "You cannot modify another store's product.");
  }

  Object.assign(product, updates);
  await product.save();
  return product;
}

export async function deleteProduct(requestingUser, productId) {
  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, "Product not found.");
  }

  const isOwner =
    product.storeId.toString() === requestingUser.storeId?.toString();
  if (!isOwner && requestingUser.role !== "superadmin") {
    throw new ApiError(403, "You cannot delete another store's product.");
  }

  // Clean up every uploaded image in Cloudinary before removing the record —
  // otherwise deleted products leave orphaned files in the media library.
  await Promise.all(
    product.images.map((img) => deleteFromCloudinary(img.publicId)),
  );

  await product.deleteOne();
  return { message: "Product deleted successfully." };
}

/** Uploads each file to Cloudinary and appends the results to product.images. */
export async function addProductImages(requestingUser, productId, files) {
  if (!files || files.length === 0) {
    throw new ApiError(400, "At least one image file is required.");
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, "Product not found.");
  }

  const isOwner =
    product.storeId.toString() === requestingUser.storeId?.toString();
  if (!isOwner && requestingUser.role !== "superadmin") {
    throw new ApiError(403, "You cannot modify another store's product.");
  }

  if (product.images.length + files.length > 8) {
    throw new ApiError(400, "A product can have at most 8 images.");
  }

  const folder = `zaalima/products/${product.storeId}`;
  const uploaded = await Promise.all(
    files.map((file) => uploadBufferToCloudinary(file.buffer, folder)),
  );

  product.images.push(...uploaded);
  await product.save();
  return product;
}

/** Removes one image by its position in the array — both from Cloudinary and the document. */
export async function removeProductImage(
  requestingUser,
  productId,
  imageIndex,
) {
  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, "Product not found.");
  }

  const isOwner =
    product.storeId.toString() === requestingUser.storeId?.toString();
  if (!isOwner && requestingUser.role !== "superadmin") {
    throw new ApiError(403, "You cannot modify another store's product.");
  }

  const image = product.images[imageIndex];
  if (!image) {
    throw new ApiError(404, "Image not found at that index.");
  }

  await deleteFromCloudinary(image.publicId);
  product.images.splice(imageIndex, 1);
  await product.save();
  return product;
}
