import { ShieldAlert } from "lucide-react";
import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../hooks/useAuth";
function AdminRoute() {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) {
    return <section className="bg-mist py-16 text-center text-sm font-semibold text-graphite">Checking access...</section>;
  }
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  if (user.role !== "admin" && user.role !== "staff") {
    return <Navigate to="/fleet" replace />;
  }
  return <Outlet />;
}
export {
  AdminRoute
};
