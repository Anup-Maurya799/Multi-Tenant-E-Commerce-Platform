// eslint-disable-next-line no-unused-vars
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FaPlus, FaPen, FaTrash, FaBoxOpen } from "react-icons/fa";
import {
  fetchMyProducts,
  updateProduct,
  deleteProduct,
} from "../../store/slices/productSlice";

function ProductListPage() {
  const dispatch = useDispatch();
  const { items, status, error } = useSelector((state) => state.products);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  useEffect(() => {
    dispatch(fetchMyProducts());
  }, [dispatch]);

  const handleTogglePublish = async (product) => {
    setTogglingId(product._id);
    try {
      await dispatch(
        updateProduct({
          productId: product._id,
          updates: { isPublished: !product.isPublished },
        }),
      ).unwrap();
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (productId) => {
    await dispatch(deleteProduct(productId))
      .unwrap()
      .catch(() => {});
    setConfirmingDeleteId(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Products</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage your inventory, pricing, and variants
          </p>
        </div>
        <Link
          to="/vendor/products/new"
          className="flex items-center gap-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold px-4 py-2.5 transition-colors shadow-sm shadow-sky-200"
        >
          <FaPlus size={13} />
          Add Product
        </Link>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
      )}

      {status === "loading" && (
        <div className="bg-white rounded-xl border border-sky-100 p-10 text-center text-sm text-slate-500">
          Loading your products...
        </div>
      )}

      {status === "succeeded" && items.length === 0 && (
        <div className="bg-white rounded-xl border border-sky-100 p-10 text-center">
          <FaBoxOpen className="mx-auto text-sky-300 mb-3" size={32} />
          <p className="text-slate-600 font-medium">No products yet</p>
          <p className="text-sm text-slate-500 mt-1 mb-4">
            Add your first product to start selling.
          </p>
          <Link
            to="/vendor/products/new"
            className="inline-block rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold px-4 py-2.5 transition-colors"
          >
            Add Product
          </Link>
        </div>
      )}

      {items.length > 0 && (
        <div className="bg-white rounded-xl border border-sky-100 overflow-hidden">
          {/* Table on desktop, stacked cards on mobile — same data, no horizontal scroll fight */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-sky-100 text-left text-slate-500">
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Stock</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((product) => (
                  <tr
                    key={product._id}
                    className="border-b border-sky-50 last:border-0"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-sky-50 overflow-hidden flex-shrink-0">
                          {product.images?.[0] && (
                            <img
                              src={product.images[0].url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <span className="font-medium text-slate-700">
                          {product.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      Rs.{Number(product.price).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          product.stock === 0 ?
                            "text-red-500 font-medium"
                          : "text-slate-600"
                        }
                      >
                        {product.stock === 0 ? "Out of stock" : product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleTogglePublish(product)}
                        disabled={togglingId === product._id}
                        className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                          product.isPublished ?
                            "bg-sky-100 text-sky-700 hover:bg-sky-200"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        }`}
                      >
                        {product.isPublished ? "Published" : "Draft"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          to={`/vendor/products/${product._id}/edit`}
                          className="text-slate-400 hover:text-sky-500 transition-colors"
                          aria-label={`Edit ${product.name}`}
                        >
                          <FaPen size={14} />
                        </Link>
                        {confirmingDeleteId === product._id ?
                          <span className="flex items-center gap-2 text-xs">
                            <button
                              onClick={() => handleDelete(product._id)}
                              className="text-red-500 font-semibold"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setConfirmingDeleteId(null)}
                              className="text-slate-400"
                            >
                              Cancel
                            </button>
                          </span>
                        : <button
                            onClick={() => setConfirmingDeleteId(product._id)}
                            className="text-slate-400 hover:text-red-500 transition-colors"
                            aria-label={`Delete ${product.name}`}
                          >
                            <FaTrash size={14} />
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile stacked cards */}
          <div className="md:hidden divide-y divide-sky-50">
            {items.map((product) => (
              <div key={product._id} className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-12 w-12 rounded-lg bg-sky-50 overflow-hidden flex-shrink-0">
                    {product.images?.[0] && (
                      <img
                        src={product.images[0].url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-700 truncate">
                      {product.name}
                    </p>
                    <p className="text-sm text-slate-500">
                      Rs.{Number(product.price).toFixed(2)} ·{" "}
                      {product.stock === 0 ?
                        "Out of stock"
                      : `${product.stock} in stock`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handleTogglePublish(product)}
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      product.isPublished ?
                        "bg-sky-100 text-sky-700"
                      : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {product.isPublished ? "Published" : "Draft"}
                  </button>
                  <div className="flex items-center gap-4">
                    <Link
                      to={`/vendor/products/${product._id}/edit`}
                      className="text-slate-400"
                    >
                      <FaPen size={14} />
                    </Link>
                    <button
                      onClick={() => setConfirmingDeleteId(product._id)}
                      className="text-slate-400"
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>
                </div>
                {confirmingDeleteId === product._id && (
                  <div className="mt-2 flex items-center gap-3 text-xs">
                    <button
                      onClick={() => handleDelete(product._id)}
                      className="text-red-500 font-semibold"
                    >
                      Confirm delete
                    </button>
                    <button
                      onClick={() => setConfirmingDeleteId(null)}
                      className="text-slate-400"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductListPage;
