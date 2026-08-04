// eslint-disable-next-line no-unused-vars
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { createStore } from "../../store/slices/storeSlice";
import { validateStoreForm, hasErrors } from "../../utils/validators";

/**
 * First screen a new vendor sees — every product/order action on the
 * backend requires a storeId, so this has to happen before anything else
 * in the Vendor Dashboard makes sense. Deliberately standalone (its own
 * centered card, like AuthLayout) rather than wrapped in VendorLayout,
 * since the sidebar's nav items would all be broken without a store yet.
 */
function CreateStorePage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const validationErrors = validateStoreForm({ name });
    setErrors(validationErrors);
    if (hasErrors(validationErrors)) return;

    setIsSubmitting(true);
    try {
      await dispatch(createStore({ name, description })).unwrap();
      navigate("/vendor/dashboard", { replace: true });
    } catch (errorMessage) {
      setMessage(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-sky-100 px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-sky-100 border border-sky-100 p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 h-12 w-12 rounded-xl bg-sky-500 flex items-center justify-center text-white font-bold text-lg">
            Z
          </div>
          <h2 className="text-2xl font-bold text-slate-800">
            Set up your store
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Welcome, {user?.name}. Give your storefront a name to get started —
            you can add a logo and more details later.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Store Name
            </label>
            <input
              id="name"
              type="text"
              placeholder="Priya's Handmade Candles"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={!!errors.name}
              className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400
                focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition
                ${errors.name ? "border-red-400" : "border-sky-200"}`}
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
              Description{" "}
              <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="description"
              rows={3}
              placeholder="What do you sell? Who is it for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-sky-200 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition resize-none"
            />
          </div>

          {message && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-sky-500 hover:bg-sky-600 active:bg-sky-700 disabled:bg-sky-300 disabled:cursor-not-allowed text-white font-semibold py-2.5 text-sm transition-colors shadow-sm shadow-sky-200 flex items-center justify-center gap-2"
          >
            {isSubmitting && (
              <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            {isSubmitting ? "Creating store..." : "Create store & continue"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateStorePage;
