import { Navigate } from "react-router-dom";
import { useAuth } from "../context/auth-store";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 font-medium">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If allowedRoles is provided, check if user.role is in the list
  // SUPER_ADMIN bypasses all role checks
  if (
    allowedRoles &&
    user?.role !== "SUPER_ADMIN" &&
    !allowedRoles.includes(user?.role)
  ) {
    console.warn(
      `[RBAC] Access denied for role: ${user?.role}. Allowed: ${allowedRoles}`,
    );
    return <Navigate to="/" replace />;
  }

  return children;
}
