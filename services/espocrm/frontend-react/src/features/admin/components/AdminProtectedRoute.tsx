/**
 * AdminProtectedRoute - Route guard that requires admin privileges
 */
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store';
import { Shield, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AdminProtectedRouteProps {
  children: React.ReactElement;
}

export function AdminProtectedRoute({
  children,
}: AdminProtectedRouteProps): React.ReactElement {
  const location = useLocation();
  const { isAuthenticated, user } = useAuthStore();

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Not an admin - show access denied
  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <Shield className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-500 mb-6">
            You do not have permission to access the administration area.
            Please contact your system administrator if you believe this is an error.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return children;
}

export default AdminProtectedRoute;
