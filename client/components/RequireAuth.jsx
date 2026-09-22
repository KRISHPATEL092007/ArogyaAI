import { Navigate } from "react-router-dom";
import { getRole, isAuthenticated } from "@shared/api";

/**
 * Wrap a page element with <RequireAuth role="patient"> or role="doctor"
 * to redirect signed-out (or wrong-role) users to the matching login page.
 */
export default function RequireAuth({ role, children }) {
  if (!isAuthenticated() || getRole() !== role) {
    return <Navigate to={role === "doctor" ? "/doctor-login" : "/user-login"} replace />;
  }

  return children;
}
