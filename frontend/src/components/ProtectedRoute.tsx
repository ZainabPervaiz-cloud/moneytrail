/**
 * Wraps a page that requires login. Renders the page if authenticated,
 * otherwise bounces to /login — used so we don't repeat this check in
 * every single page component.
 */

import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
