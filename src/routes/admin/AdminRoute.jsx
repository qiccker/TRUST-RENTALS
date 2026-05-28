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
    return <section className="bg-mist py-16">
        <div className="mx-auto max-w-xl rounded-md border border-line bg-white p-8 text-center shadow-sm">
          <ShieldAlert className="mx-auto h-12 w-12 text-ember" aria-hidden="true" />
          <h1 className="mt-4 text-3xl font-black text-ink">Admin access required</h1>
          <p className="mt-3 text-sm leading-6 text-graphite">
            This area is protected by the account role and the database RLS policies.
          </p>
          <Link to="/fleet" className="mt-6 inline-block">
            <Button>Return to fleet</Button>
          </Link>
        </div>
      </section>;
  }
  return <Outlet />;
}
export {
  AdminRoute
};
