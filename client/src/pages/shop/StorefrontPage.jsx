import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import productService from "../../services/productService";

function StorefrontPage() {
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | succeeded | failed
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    productService
      .listPublicProducts({ page: 1, limit: 24 })
      .then((data) => {
        if (cancelled) return;
        setProducts(data.products);
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
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-xl font-bold text-slate-800 mb-1">
        Shop all products
      </h1>
      <p className="text-sm text-slate-500 mb-6">
        Browse products from every vendor on the marketplace.
      </p>

      {status === "loading" && (
        <div className="bg-white rounded-xl border border-sky-100 p-10 text-center text-sm text-slate-500">
          Loading products...
        </div>
      )}

      {status === "failed" && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {status === "succeeded" && products.length === 0 && (
        <div className="bg-white rounded-xl border border-sky-100 p-10 text-center text-sm text-slate-500">
          No products available yet — check back soon.
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <Link
            key={product._id}
            to={`/shop/products/${product._id}`}
            className="bg-white rounded-xl border border-sky-100 overflow-hidden hover:shadow-md hover:shadow-sky-100 transition-shadow"
          >
            <div className="aspect-square bg-sky-50">
              {product.images?.[0] && (
                <img
                  src={product.images[0].url}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <div className="p-3">
              <p className="text-sm font-medium text-slate-700 truncate">
                {product.name}
              </p>
              <p className="text-sm text-sky-600 font-semibold mt-0.5">
                ${Number(product.price).toFixed(2)}
              </p>
              {product.stock === 0 && (
                <p className="text-xs text-red-400 mt-0.5">Out of stock</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default StorefrontPage;
