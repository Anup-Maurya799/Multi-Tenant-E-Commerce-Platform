import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { fetchCurrentUser } from "./store/slices/authSlice";
import AppRoutes from "./routes/AppRoutes";

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (token) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch]);

  return <AppRoutes />;
}

export default App;
