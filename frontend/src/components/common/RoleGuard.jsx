import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLocation } from "react-router-dom";
/**
 * RoleGuard — role-based access control wrapper.
 *
 * Used around pages that are restricted to specific roles.
 * If the authenticated user doesn't have the required role,
 * redirect to /dashboard (they ARE logged in, just not authorized).
 *
 * Usage:
 *   <Route path="/contracts/upload" element={
 *     <RoleGuard roles={['contract_manager']}>
 *       <UploadContractPage />
 *     </RoleGuard>
 *   } />
 */
export default function RoleGuard({ roles, children }) {
  const { hasRole } = useAuth();
  const { pathname } = useLocation();

  if (hasRole("pmo") && !pathname.startsWith("/admin")) {
    return <Navigate to="/admin" replace />;
  }
  if (!hasRole(...roles)) {
    // User is authenticated but doesn't have the right role.
    // Redirect to dashboard instead of login (they ARE logged in,
    // just not authorized for this specific page).
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
