// eslint-disable-next-line no-unused-vars
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaCheckCircle } from "react-icons/fa";
import { updateStore, uploadStoreLogo } from "../../store/slices/storeSlice";
import { validateStoreForm, hasErrors } from "../../utils/validators";

function StoreSettingsPage() {
  const dispatch = useDispatch();
  const myStore = useSelector((state) => state.store.myStore);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Seed the form once the store loads (VendorLayout guarantees myStore
  // exists by the time this page renders).
  useEffect(() => {
    if (myStore) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(myStore.name);
      setDescription(myStore.description || "");
      setIsActive(myStore.isActive);
    }
  }, [myStore]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setSuccessMessage("");

    const validationErrors = validateStoreForm({ name });
    setErrors(validationErrors);
    if (hasErrors(validationErrors)) return;

    setIsSubmitting(true);
    try {
      await dispatch(
        updateStore({
          storeId: myStore._id,
          updates: { name, description, isActive },
        }),
      ).unwrap();
      setSuccessMessage("Store details updated.");
    } catch (errorMessage) {
      setMessage(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    setMessage("");
    try {
      await dispatch(uploadStoreLogo({ storeId: myStore._id, file })).unwrap();
    } catch (errorMessage) {
      setMessage(errorMessage);
    } finally {
      setIsUploadingLogo(false);
      e.target.value = "";
    }
  };

  if (!myStore) return null; // VendorLayout redirects before this would ever render without a store

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold text-slate-800 mb-6">Store Settings</h1>

      {/* Logo */}
      <div className="bg-white rounded-xl border border-sky-100 p-5 mb-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">
          Store Logo
        </h2>
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-xl bg-sky-50 overflow-hidden flex-shrink-0 border border-sky-100">
            {myStore.logoUrl && (
              <img
                src={myStore.logoUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            )}
          </div>
          <label className="text-sm text-sky-600 hover:text-sky-700 font-medium cursor-pointer">
            {isUploadingLogo ?
              <span className="flex items-center gap-2 text-slate-400">
                <span className="h-3.5 w-3.5 border-2 border-sky-200 border-t-sky-500 rounded-full animate-spin" />
                Uploading...
              </span>
            : "Change logo"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleLogoChange}
              disabled={isUploadingLogo}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Store details */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="bg-white rounded-xl border border-sky-100 p-5 space-y-4"
      >
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

        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-sky-300 text-sky-500 focus:ring-sky-400"
          />
          Store is active (visible to customers)
        </label>

        {message && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {message}
          </p>
        )}
        {successMessage && (
          <p className="text-sm text-sky-600 bg-sky-50 border border-sky-100 rounded-lg px-3 py-2 flex items-center gap-2">
            <FaCheckCircle size={13} /> {successMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-sky-500 hover:bg-sky-600 active:bg-sky-700 disabled:bg-sky-300 disabled:cursor-not-allowed text-white font-semibold px-5 py-2.5 text-sm transition-colors shadow-sm shadow-sky-200 flex items-center gap-2"
        >
          {isSubmitting && (
            <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          )}
          {isSubmitting ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}

export default StoreSettingsPage;
