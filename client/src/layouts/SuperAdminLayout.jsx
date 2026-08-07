import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FaSignOutAlt } from "react-icons/fa";
import { logoutUser } from "../store/slices/authSlice";

/**
 * Deliberately minimal — Super Admin only has one screen right now
 * (platform-wide analytics), so a full sidebar nav would be premature.
 * Add nav items here as more admin screens get built.
 */
function SuperAdminLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen w-full bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center text-white font-bold text-sm">
            Z
          </div>
          <span className="font-semibold text-slate-800">Super Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500">{user?.name}</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-500 transition-colors"
          >
            <FaSignOutAlt size={13} />
            Logout
          </button>
        </div>
      </header>
      <main className="p-4 sm:p-6">
        <Outlet />
      </main>
    </div>
  );
}

export default SuperAdminLayout;
