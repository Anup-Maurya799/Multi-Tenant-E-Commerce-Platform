import Store from "../models/Store.js";
import User from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { slugify } from "../utils/slugify.js";
import {
  uploadBufferToCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinaryUpload.js";

/** Guarantees a unique slug by appending a short random suffix on collision. */
async function generateUniqueSlug(name) {
  const base = slugify(name);
  let slug = base;
  let attempt = 0;

  while (await Store.findOne({ slug })) {
    attempt += 1;
    slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
    if (attempt > 5) {
      throw new ApiError(
        500,
        "Could not generate a unique store slug. Try a different name.",
      );
    }
  }

  return slug;
}

/** A vendor may own exactly one store in this MVP — enforced here, not just in the UI. */
export async function createStore(vendorUser, { name, description, logoUrl }) {
  if (vendorUser.storeId) {
    throw new ApiError(
      409,
      "You already have a store. Each vendor can only own one store.",
    );
  }

  const slug = await generateUniqueSlug(name);

  const store = await Store.create({
    name,
    slug,
    owner: vendorUser._id,
    description: description || "",
    logoUrl: logoUrl || "",
  });

  // Link the store back onto the user — this is the tenant-isolation key
  // that every subsequent product/order query filters by.
  vendorUser.storeId = store._id;
  await vendorUser.save();

  return store;
}

export async function getMyStore(vendorUser) {
  if (!vendorUser.storeId) {
    throw new ApiError(404, "You don't have a store yet.");
  }
  const store = await Store.findById(vendorUser.storeId);
  if (!store) {
    throw new ApiError(404, "Store not found.");
  }
  return store;
}

/** Public lookup — used by the storefront and by customers browsing a vendor's page. */
export async function getStoreBySlug(slug) {
  const store = await Store.findOne({ slug, isActive: true });
  if (!store) {
    throw new ApiError(404, "Store not found.");
  }
  return store;
}

export async function listActiveStores({ page = 1, limit = 20 }) {
  const skip = (page - 1) * limit;
  const [stores, total] = await Promise.all([
    Store.find({ isActive: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Store.countDocuments({ isActive: true }),
  ]);

  return { stores, total, page: Number(page), pages: Math.ceil(total / limit) };
}

/** Only the owning vendor (or a superadmin) can update a store's details. */
export async function updateStore(requestingUser, storeId, updates) {
  const store = await Store.findById(storeId);
  if (!store) {
    throw new ApiError(404, "Store not found.");
  }

  const isOwner = store.owner.toString() === requestingUser._id.toString();
  if (!isOwner && requestingUser.role !== "superadmin") {
    throw new ApiError(403, "You do not have permission to update this store.");
  }

  Object.assign(store, updates);
  await store.save();
  return store;
}

/** Replaces the store's logo: uploads the new one, then cleans up the old one from Cloudinary. */
export async function updateStoreLogo(requestingUser, storeId, file) {
  if (!file) {
    throw new ApiError(400, "A logo image file is required.");
  }

  const store = await Store.findById(storeId);
  if (!store) {
    throw new ApiError(404, "Store not found.");
  }

  const isOwner = store.owner.toString() === requestingUser._id.toString();
  if (!isOwner && requestingUser.role !== "superadmin") {
    throw new ApiError(403, "You do not have permission to update this store.");
  }

  const previousPublicId = store.logoPublicId;
  const { url, publicId } = await uploadBufferToCloudinary(
    file.buffer,
    `zaalima/stores/${store._id}`,
  );

  store.logoUrl = url;
  store.logoPublicId = publicId;
  await store.save();

  // Clean up the old logo only after the new one is confirmed saved.
  if (previousPublicId) {
    await deleteFromCloudinary(previousPublicId);
  }

  return store;
}
