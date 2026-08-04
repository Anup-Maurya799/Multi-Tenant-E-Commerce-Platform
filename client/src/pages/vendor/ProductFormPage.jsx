// eslint-disable-next-line no-unused-vars
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FaPlus, FaTrash, FaImage, FaTimes } from "react-icons/fa";
import {
  createProduct,
  updateProduct,
  uploadProductImages,
  deleteProductImage,
} from "../../store/slices/productSlice";
import productService from "../../services/productService";
import { validateProductForm, hasErrors } from "../../utils/validators";

const emptyVariant = () => ({
  size: "",
  color: "",
  stock: "",
  priceOverride: "",
});

/**
 * One form handles both "Add Product" (no :productId) and "Edit Product"
 * (:productId present) — same fields, same validation, just a different
 * initial data source and a different dispatch on submit.
 */
function ProductFormPage() {
  const { productId } = useParams();
  const isEditMode = Boolean(productId);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [variants, setVariants] = useState([]);
  const [images, setImages] = useState([]); // existing { url, publicId } from the server

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isLoadingProduct, setIsLoadingProduct] = useState(isEditMode);

  const mutationError = useSelector((state) => state.products.error);

  // In edit mode, load the existing product directly (not from the list —
  // a vendor might land here via a bookmarked/refreshed URL).
  useEffect(() => {
    if (!isEditMode) return;
    let cancelled = false;

    productService
      .getProduct(productId)
      .then((data) => {
        if (cancelled) return;
        const p = data.product;
        setName(p.name);
        setDescription(p.description || "");
        setPrice(String(p.price));
        setStock(String(p.stock));
        setIsPublished(p.isPublished);
        setVariants(p.variants || []);
        setImages(p.images || []);
      })
      .catch((errorMessage) => setMessage(errorMessage))
      .finally(() => !cancelled && setIsLoadingProduct(false));

    return () => {
      cancelled = true;
    };
  }, [isEditMode, productId]);

  const handleAddVariant = () => setVariants((v) => [...v, emptyVariant()]);
  const handleRemoveVariant = (index) =>
    setVariants((v) => v.filter((_, i) => i !== index));
  const handleVariantChange = (index, field, value) => {
    setVariants((v) =>
      v.map((variant, i) =>
        i === index ? { ...variant, [field]: value } : variant,
      ),
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const validationErrors = validateProductForm({ name, price, stock });
    setErrors(validationErrors);
    if (hasErrors(validationErrors)) return;

    const payload = {
      name,
      description,
      price: Number(price),
      stock: stock === "" ? 0 : Number(stock),
      isPublished,
      variants: variants
        .filter((v) => v.size || v.color) // drop fully-empty rows
        .map((v) => ({
          size: v.size,
          color: v.color,
          stock: v.stock === "" ? 0 : Number(v.stock),
          priceOverride:
            v.priceOverride === "" ? undefined : Number(v.priceOverride),
        })),
    };

    setIsSubmitting(true);
    try {
      if (isEditMode) {
        await dispatch(updateProduct({ productId, updates: payload })).unwrap();
      } else {
        const created = await dispatch(createProduct(payload)).unwrap();
        // If images were picked before the product existed, upload them now
        // that we have a productId to attach them to.
        if (fileInputRef.current?.files?.length) {
          await dispatch(
            uploadProductImages({
              productId: created._id,
              files: fileInputRef.current.files,
            }),
          ).unwrap();
        }
      }
      navigate("/vendor/dashboard");
    } catch (errorMessage) {
      setMessage(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  /** In edit mode, images upload immediately (there's already a productId to attach to). */
  const handleImageFilesSelected = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!isEditMode) return; // create mode: files stay queued until the product exists (see handleSubmit)

    setIsUploadingImages(true);
    try {
      const updated = await dispatch(
        uploadProductImages({ productId, files }),
      ).unwrap();
      setImages(updated.images);
    } catch (errorMessage) {
      setMessage(errorMessage);
    } finally {
      setIsUploadingImages(false);
      e.target.value = ""; // allow re-selecting the same file if needed
    }
  };

  const handleRemoveImage = async (imageIndex) => {
    if (!isEditMode) return;
    try {
      const updated = await dispatch(
        deleteProductImage({ productId, imageIndex }),
      ).unwrap();
      setImages(updated.images);
    } catch (errorMessage) {
      setMessage(errorMessage);
    }
  };

  if (isLoadingProduct) {
    return (
      <div className="bg-white rounded-xl border border-sky-100 p-10 text-center text-sm text-slate-500">
        Loading product...
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold text-slate-800 mb-6">
        {isEditMode ? "Edit Product" : "Add Product"}
      </h1>

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* Basic info */}
        <div className="bg-white rounded-xl border border-sky-100 p-5 space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Product Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition ${errors.name ? "border-red-400" : "border-sky-200"}`}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-sky-200 px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="price"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Price ($)
              </label>
              <input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition ${errors.price ? "border-red-400" : "border-sky-200"}`}
              />
              {errors.price && (
                <p className="mt-1 text-xs text-red-500">{errors.price}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="stock"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Stock
              </label>
              <input
                id="stock"
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition ${errors.stock ? "border-red-400" : "border-sky-200"}`}
              />
              {errors.stock && (
                <p className="mt-1 text-xs text-red-500">{errors.stock}</p>
              )}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="h-4 w-4 rounded border-sky-300 text-sky-500 focus:ring-sky-400"
            />
            Published (visible to customers)
          </label>
        </div>

        {/* Variants */}
        <div className="bg-white rounded-xl border border-sky-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-700">Variants</h2>
            <button
              type="button"
              onClick={handleAddVariant}
              className="flex items-center gap-1.5 text-xs font-medium text-sky-600 hover:text-sky-700"
            >
              <FaPlus size={11} /> Add variant
            </button>
          </div>

          {variants.length === 0 && (
            <p className="text-sm text-slate-400">
              No variants — this product has a single price and stock count.
            </p>
          )}

          <div className="space-y-3">
            {variants.map((variant, index) => (
              <div
                key={index}
                className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-start bg-sky-50/50 rounded-lg p-3"
              >
                <input
                  placeholder="Size (e.g. Large)"
                  value={variant.size}
                  onChange={(e) =>
                    handleVariantChange(index, "size", e.target.value)
                  }
                  className="rounded-lg border border-sky-200 px-2.5 py-2 text-xs col-span-1 sm:col-span-1 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
                <input
                  placeholder="Color"
                  value={variant.color}
                  onChange={(e) =>
                    handleVariantChange(index, "color", e.target.value)
                  }
                  className="rounded-lg border border-sky-200 px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Stock"
                  value={variant.stock}
                  onChange={(e) =>
                    handleVariantChange(index, "stock", e.target.value)
                  }
                  className="rounded-lg border border-sky-200 px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Price override"
                  value={variant.priceOverride}
                  onChange={(e) =>
                    handleVariantChange(index, "priceOverride", e.target.value)
                  }
                  className="rounded-lg border border-sky-200 px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveVariant(index)}
                  className="flex items-center justify-center text-slate-400 hover:text-red-500 h-full"
                  aria-label="Remove variant"
                >
                  <FaTrash size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Images */}
        <div className="bg-white rounded-xl border border-sky-100 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Images</h2>

          {images.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4">
              {images.map((img, index) => (
                <div
                  key={img.publicId || index}
                  className="relative aspect-square rounded-lg overflow-hidden bg-sky-50 group"
                >
                  <img
                    src={img.url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove image"
                  >
                    <FaTimes size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <label className="flex items-center justify-center gap-2 border-2 border-dashed border-sky-200 rounded-lg py-6 text-sm text-slate-500 cursor-pointer hover:bg-sky-50 transition-colors">
            {isUploadingImages ?
              <span className="h-4 w-4 border-2 border-sky-200 border-t-sky-500 rounded-full animate-spin" />
            : <FaImage className="text-sky-400" />}
            {isUploadingImages ?
              "Uploading..."
            : isEditMode ?
              "Upload images (JPEG, PNG, WEBP — up to 5 at a time)"
            : "Select images (uploaded once you save)"}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleImageFilesSelected}
              className="hidden"
            />
          </label>
        </div>

        {(message || mutationError) && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {message || mutationError}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-sky-500 hover:bg-sky-600 active:bg-sky-700 disabled:bg-sky-300 disabled:cursor-not-allowed text-white font-semibold px-5 py-2.5 text-sm transition-colors shadow-sm shadow-sky-200 flex items-center gap-2"
          >
            {isSubmitting && (
              <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            {isSubmitting ?
              "Saving..."
            : isEditMode ?
              "Save Changes"
            : "Create Product"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/vendor/dashboard")}
            className="rounded-lg border border-sky-200 text-slate-600 hover:bg-sky-50 font-semibold px-5 py-2.5 text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProductFormPage;
