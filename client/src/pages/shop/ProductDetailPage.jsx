import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { FaShoppingCart, FaCheckCircle } from "react-icons/fa";
import productService from "../../services/productService";
import { addItem } from "../../store/slices/cartSlice";

function ProductDetailPage() {
  const { productId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(null); // null = no variants / base product
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    productService
      .getProduct(productId)
      .then((data) => {
        if (cancelled) return;
        setProduct(data.product);
        setStatus("succeeded");
      })
      .catch((errorMessage) => {
        if (cancelled) return;
        setError(errorMessage);
        setStatus("failed");
      });
    return () => {
      cancelled = true;
    };
  }, [productId]);

  if (status === "loading") {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-xl border border-sky-100 p-10 text-center text-sm text-slate-500">
        Loading product...
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="max-w-4xl mx-auto">
        <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
        <Link
          to="/shop"
          className="text-sm text-sky-600 hover:text-sky-700 font-medium"
        >
          &larr; Back to shop
        </Link>
      </div>
    );
  }

  const hasVariants = product.variants && product.variants.length > 0;
  const selectedVariant =
    hasVariants && selectedVariantIndex !== null ?
      product.variants[selectedVariantIndex]
    : null;
  const effectivePrice = selectedVariant?.priceOverride ?? product.price;
  const effectiveStock =
    selectedVariant ? selectedVariant.stock : product.stock;
  const canAddToCart =
    effectiveStock > 0 && (!hasVariants || selectedVariantIndex !== null);

  const variantLabel =
    selectedVariant ?
      [selectedVariant.size, selectedVariant.color].filter(Boolean).join(" / ")
    : null;

  const handleAddToCart = () => {
    dispatch(
      addItem({
        productId: product._id,
        storeId: product.storeId,
        name: product.name + (variantLabel ? ` (${variantLabel})` : ""),
        price: effectivePrice,
        image: product.images?.[0]?.url,
        quantity,
        maxStock: effectiveStock,
        variantLabel,
      }),
    );
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        to="/shop"
        className="text-sm text-sky-600 hover:text-sky-700 font-medium mb-4 inline-block"
      >
        &larr; Back to shop
      </Link>

      <div className="bg-white rounded-xl border border-sky-100 p-5 sm:p-6 grid sm:grid-cols-2 gap-6">
        {/* Images */}
        <div>
          <div className="aspect-square bg-sky-50 rounded-lg overflow-hidden mb-3">
            {product.images?.[activeImage] && (
              <img
                src={product.images[activeImage].url}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            )}
          </div>
          {product.images?.length > 1 && (
            <div className="flex gap-2">
              {product.images.map((img, index) => (
                <button
                  key={img.publicId}
                  onClick={() => setActiveImage(index)}
                  className={`h-14 w-14 rounded-lg overflow-hidden border-2 ${
                    activeImage === index ? "border-sky-500" : (
                      "border-transparent"
                    )
                  }`}
                >
                  <img
                    src={img.url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <h1 className="text-xl font-bold text-slate-800">{product.name}</h1>
          <p className="text-2xl font-semibold text-sky-600 mt-2">
            ${Number(effectivePrice).toFixed(2)}
          </p>
          {product.description && (
            <p className="text-sm text-slate-500 mt-3 leading-relaxed">
              {product.description}
            </p>
          )}

          {hasVariants && (
            <div className="mt-4">
              <p className="text-sm font-medium text-slate-700 mb-2">
                Choose an option
              </p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((variant, index) => {
                  const label = [variant.size, variant.color]
                    .filter(Boolean)
                    .join(" / ");
                  const isSelected = selectedVariantIndex === index;
                  const outOfStock = variant.stock === 0;
                  return (
                    <button
                      key={index}
                      disabled={outOfStock}
                      onClick={() => setSelectedVariantIndex(index)}
                      className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                        outOfStock ?
                          "border-slate-100 text-slate-300 cursor-not-allowed"
                        : isSelected ? "border-sky-500 bg-sky-500 text-white"
                        : "border-sky-200 text-slate-600 hover:bg-sky-50"
                      }`}
                    >
                      {label} {outOfStock && "(out of stock)"}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 mt-5">
            <label htmlFor="qty" className="text-sm font-medium text-slate-700">
              Qty
            </label>
            <input
              id="qty"
              type="number"
              min="1"
              max={effectiveStock || 1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              className="w-16 rounded-lg border border-sky-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
            <span className="text-xs text-slate-400">
              {effectiveStock > 0 ?
                `${effectiveStock} in stock`
              : "Out of stock"}
            </span>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={!canAddToCart}
            className="mt-5 w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg bg-sky-500 hover:bg-sky-600 disabled:bg-sky-200 disabled:cursor-not-allowed text-white font-semibold px-5 py-2.5 text-sm transition-colors shadow-sm shadow-sky-200"
          >
            {justAdded ?
              <FaCheckCircle />
            : <FaShoppingCart size={14} />}
            {justAdded ?
              "Added to cart"
            : hasVariants && selectedVariantIndex === null ?
              "Select an option"
            : "Add to cart"}
          </button>

          {justAdded && (
            <button
              onClick={() => navigate("/cart")}
              className="mt-2 block text-sm text-sky-600 hover:text-sky-700 font-medium"
            >
              View cart &rarr;
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductDetailPage;
