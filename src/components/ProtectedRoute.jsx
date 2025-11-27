import { Navigate } from "react-router-dom";
import { isLoggedIn } from "../api/auth";
import { getUserRole, hasAnyRole, getRoleDashboard } from "../utils/authUtils";

/**
 * ProtectedRoute - Restrict access based on authentication and role
 * 
 * Usage:
 * <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
 *   <AdminDashboard />
 * </ProtectedRoute>
 */
export default function ProtectedRoute({ children, allowedRoles = [] }) {
    // Check if user is logged in
    if (!isLoggedIn()) {
        console.log('[ProtectedRoute] User not logged in, redirecting to /login');
        return <Navigate to="/login" replace />;
    }

    // If no role restrictions, allow access
    if (allowedRoles.length === 0) {
        return children;
    }

    // Check role
    const userRole = getUserRole();
    console.log('[ProtectedRoute] User role:', userRole, 'Allowed roles:', allowedRoles);

    if (!userRole) {
        console.warn('[ProtectedRoute] No role found in token, redirecting to /login');
        return <Navigate to="/login" replace />;
    }

    // Check if user has one of the allowed roles
    if (!hasAnyRole(allowedRoles)) {
        console.warn(`[ProtectedRoute] Access denied. User role "${userRole}" not in allowed roles:`, allowedRoles);
        
        // Redirect to user's appropriate dashboard
        const userDashboard = getRoleDashboard(userRole);
        return <Navigate to={userDashboard} replace />;
    }

    // User has required role, render children
    return children;
}
