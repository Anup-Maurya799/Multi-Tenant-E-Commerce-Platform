// eslint-disable-next-line no-unused-vars
import React from "react";
import AppRoutes from "./routes/AppRoutes";

function App() {
  return <AppRoutes />;
}

export default App;
// eslint-disable-next-line no-unused-vars
// import React, { useEffect } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { fetchCurrentUser } from "./store/slices/authSlice";
// import AppRoutes from "./routes/AppRoutes";
// import LoadingScreen from "./screens/LoadingScreen";

// function App() {
//   const dispatch = useDispatch();
//   const status = useSelector((state) => state.auth.status);

//   useEffect(() => {
//     if (status === "checkingSession") {
//       dispatch(fetchCurrentUser());
//     }
//   }, [status, dispatch]);

//   if (status === "checkingSession") {
//     return <LoadingScreen label="Restoring your session..." />;
//   }

//   return <AppRoutes />;
// }

// export default App;
