import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

function HomePage() {
  const { user } = useAuth();
  
  if (user && (user.role === 'admin' || user.role === 'staff')) {
    return <Navigate to="/admin" replace />;
  }
  
  return <Navigate to="/fleet" replace />;
}
export {
  HomePage
};
