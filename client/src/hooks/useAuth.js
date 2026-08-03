import { useState, useEffect } from "react";

/**
 * Thin session-status hook. Reads what Login/authService already writes to
 * localStorage on success. Kept intentionally simple for now — once the
 * Redux authSlice exists (store/slices/authSlice.js), this hook is the one
 * place to swap localStorage reads for `useSelector` without touching
 * ProtectedRoute/PublicRoute at all.
 */
export default function useAuth() {
  const [authState, setAuthState] = useState(() => ({
    isAuthenticated: localStorage.getItem("isLoggedIn") === "true",
    role: localStorage.getItem("activeRole") || null,
  }));

  // Keep auth state in sync if login/logout happens in another browser tab.
  useEffect(() => {
    function handleStorageChange() {
      setAuthState({
        isAuthenticated: localStorage.getItem("isLoggedIn") === "true",
        role: localStorage.getItem("activeRole") || null,
      });
    }
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return authState;
}
// import { useSelector } from "react-redux";

// export default function useAuth() {
//   const { user, isAuthenticated, status, error } = useSelector(
//     (state) => state.auth,
//   );
//   return {
//     user,
//     isAuthenticated,
//     role: user?.role || null,
//     isCheckingSession: status === "checkingSession",
//     error,
//   };
// }
