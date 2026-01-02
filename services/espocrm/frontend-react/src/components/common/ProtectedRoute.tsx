import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store';
import { LoadingSpinner } from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactElement;
}

export function ProtectedRoute({
  children,
}: ProtectedRouteProps): React.ReactElement {
  const location = useLocation();
  const { isAuthenticated, token, checkAuth } = useAuthStore();
  const [isChecking, setIsChecking] = useState(!isAuthenticated && !!localStorage.getItem('auth-token'));

  useEffect(() => {
    // Only verify if we have a token but no authenticated state
    // This handles the case where the page is refreshed and Zustand needs to rehydrate
    const tokenInStorage = localStorage.getItem('auth-token');

    if (!isAuthenticated && tokenInStorage) {
      // We have a token but aren't authenticated - verify it
      checkAuth().finally(() => setIsChecking(false));
    } else {
      // Either authenticated or no token - no need to check
      setIsChecking(false);
    }
  }, []); // Only run once on mount

  // If Zustand has rehydrated and we're authenticated, trust it
  if (isAuthenticated && token) {
    return children;
  }

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
