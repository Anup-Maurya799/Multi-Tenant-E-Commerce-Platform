// eslint-disable-next-line no-unused-vars
import React, { useEffect } from "react";
import { NavLink, Outlet, useNavigate, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  FaBoxOpen,
  FaPlusCircle,
  FaStore,
  FaSignOutAlt,
  FaChartLine,
} from "react-icons/fa";
import { logoutUser } from "../store/slices/authSlice";
import { fetchMyStore } from "../store/slices/storeSlice";
import LoadingScreen from "../screens/LoadingScreen";

const navItems = [
  { to: "/vendor/dashboard", label: "Products", icon: FaBoxOpen, end: true },
  { to: "/vendor/products/new", label: "Add Product", icon: FaPlusCircle },
  { to: "/vendor/analytics", label: "Analytics", icon: FaChartLine },
  { to: "/vendor/store", label: "Store Settings", icon: FaStore },
];

/**
 * Shell for every vendor-facing screen: sidebar nav + topbar. Also owns the
 * "does this vendor have a store yet" gate — every route nested under this
 * layout assumes a store exists, so onboarding (/vendor/onboarding) lives
 * OUTSIDE this layout to avoid a redirect loop.
 */
function VendorLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const { myStore, status } = useSelector((state) => state.store);

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchMyStore());
    }
  }, [status, dispatch]);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate("/login", { replace: true });
  };

  if (status === "idle" || status === "loading") {
    return <LoadingScreen label="Loading your store..." />;
  }

  if (status === "succeeded" && !myStore) {
    return <Navigate to="/vendor/onboarding" replace />;
  }

  return (
    <div className="min-h-screen w-full bg-sky-50 flex flex-col md:flex-row">
      {/* Sidebar — becomes a horizontal bar on mobile instead of hiding behind a hamburger,
          since a vendor's nav is only 3 items: no need for a collapse pattern here. */}
      <aside className="w-full md:w-60 bg-white border-b md:border-b-0 md:border-r border-sky-100 flex md:flex-col">
        <div className="px-5 py-4 flex items-center gap-2.5 border-b border-sky-100 md:border-b md:border-sky-100">
          <div className="h-8 w-8 rounded-lg bg-sky-500 flex items-center justify-center text-white font-bold text-sm">
            A
          </div>
          <span className="font-semibold text-slate-800 hidden sm:inline truncate">
            {myStore?.name}
          </span>
        </div>

        <nav className="flex md:flex-col gap-1 px-2 py-2 md:py-4 overflow-x-auto">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive ?
                    "bg-sky-500 text-white"
                  : "text-slate-600 hover:bg-sky-50"
                }`
              }
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="bg-white border-b border-sky-100 px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="text-sm text-slate-500">
            Signed in as{" "}
            <span className="font-medium text-slate-700">{user?.name}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-500 transition-colors"
          >
            <FaSignOutAlt size={13} />
            Logout
          </button>
        </header>

        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default VendorLayout;
