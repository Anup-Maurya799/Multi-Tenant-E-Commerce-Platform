import { useSelector } from "react-redux";

function useAuth() {
  const { user, isAuthenticated, status, error } = useSelector(
    (state) => state.auth,
  );

  return {
    user,
    isAuthenticated,
    role: user?.role,
    status,
    isCheckingSession: status === "checkingSession",
    error,
  };
}

export default useAuth;
