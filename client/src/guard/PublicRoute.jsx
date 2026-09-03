import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const PublicRoute = ({ children }) => {
  const { user } = useContext(AuthContext);

  if (user) {
    // Redirect based on role
    const role = (
      user.role?.name ||
      user.role_id?.role_name ||
      user.user?.role?.role_name
    )?.toUpperCase();

    if (role === "ADMIN") return <Navigate to="/admin/dashboard" replace />;
    if (role === "SELLER") return <Navigate to="/seller/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return children || <Outlet />;
};

export default PublicRoute;
