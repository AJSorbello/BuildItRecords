import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '../../services/AuthService';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();

  if (!authService.isAuthenticated()) {
    // Redirect to login page but save the attempted URL
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
