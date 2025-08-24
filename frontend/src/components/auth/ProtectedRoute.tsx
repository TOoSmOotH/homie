import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, isLoading, isFirstTimeSetup, user } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking auth status
  if (isLoading || isFirstTimeSetup === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  // If first time setup and not on setup page, redirect to setup
  if (isFirstTimeSetup && location.pathname !== '/setup') {
    return <Navigate to="/setup" replace />;
  }

  // If not first time setup and on setup page, redirect to login
  if (!isFirstTimeSetup && location.pathname === '/setup') {
    return <Navigate to="/login" replace />;
  }

  // If not authenticated and not on login/setup page, redirect to login
  if (!isAuthenticated && location.pathname !== '/login' && location.pathname !== '/setup') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated and trying to access login page, redirect to home
  if (isAuthenticated && location.pathname === '/login') {
    return <Navigate to="/" replace />;
  }

  // Check admin requirement
  if (requireAdmin && user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;