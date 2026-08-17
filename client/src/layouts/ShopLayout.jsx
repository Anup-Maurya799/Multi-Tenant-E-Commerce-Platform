import React from "react";
import { Link, Outlet } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FaShoppingCart, FaSignOutAlt } from "react-icons/fa";
import { logoutUser } from "../store/slices/authSlice";
import { selectCartItemCount } from "../store/slices/cartSlice";
import useAuth from "../hooks/useAuth";

/**
 * Shell for the public/customer-facing storefront (browse products, view
 * one, view cart). Deliberately separate from VendorLayout — different
 * audience, different nav, and this one stays visible to logged-out guests
 * (browsing doesn't require an account; checkout will).
 */
function ShopLayout() {
  const dispatch = useDispatch();
  const cartCount = useSelector(selectCartItemCount);
  const { isAuthenticated, user } = useAuth();

  const handleLogout = async () => {
    await dispatch(logoutUser());
  };

  return (
    <div className="min-h-screen w-full bg-sky-50">
      <header className="bg-white border-b border-sky-100 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <Link to="/shop" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-sky-500 flex items-center justify-center text-white font-bold text-sm">
            A
          </div>
          <span className="font-semibold text-slate-800 hidden sm:inline">
            Marketplace
          </span>
        </Link>

        <div className="flex items-center gap-4 sm:gap-5">
          <Link
            to="/cart"
            className="relative text-slate-600 hover:text-sky-500 transition-colors"
          >
            <FaShoppingCart size={19} />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-sky-500 text-white text-[10px] font-bold flex items-center justify-center">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
          </Link>

          {isAuthenticated ?
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-500 transition-colors"
            >
              <FaSignOutAlt size={13} />
              <span className="hidden sm:inline">
                {user?.name?.split(" ")[0]}
              </span>
            </button>
          : <Link
              to="/login"
              className="text-sm font-medium text-sky-600 hover:text-sky-700"
            >
              Login
            </Link>
          }
        </div>
      </header>

      <main className="p-4 sm:p-6">
        <Outlet />
      </main>
    </div>
  );
}

export default ShopLayout;
