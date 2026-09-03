// src/components/PrivateRoute.jsx
import { useContext } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

import Loader from "../components/Common/Loader";

const PrivateRoute = ({ allowedRoles }) => {
  const { user, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return <Loader />;
  }

  if (!user) {
    return <Navigate to="/" state={{ openLogin: true, from: window.location.pathname }} replace />;
  }

  // Handle both nested { user: { role: { role } } } and direct { role: { role } } or { role: { name } } structures
  const role = (
    user?.user?.role?.role ||
    user?.role?.role ||
    user?.role?.name ||
    user?.role_id?.role_name
  )?.toUpperCase();

  if (
    allowedRoles &&
    !allowedRoles.map((r) => r.toUpperCase()).includes(role)
  ) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;
