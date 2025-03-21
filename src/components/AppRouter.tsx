import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from './Layout';
import AdminLogin from '../pages/admin/AdminLogin';
import AdminDashboard from '../pages/admin/AdminDashboard';
import Home from './Home';
import SpotifyCallback from './SpotifyCallback';

// ScrollToTop component to ensure page scrolls to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  
  return null;
};

interface ProtectedRouteProps {
  children: JSX.Element;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('adminToken');
  console.log('ProtectedRoute - Auth state:', isAuthenticated);
  
  // Simplify the protected route to just check for authentication
  return isAuthenticated ? <>{children}</> : <Navigate to="/admin/login" replace />;
};

const AppRouter: React.FC = () => {
  // Log on initial load for debugging
  useEffect(() => {
    console.log('AppRouter mounted. Current path:', window.location.pathname);
    console.log('Authentication state:', !!localStorage.getItem('adminToken'));
  }, []);

  // Simplified routing configuration that works in both development and production
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* Spotify callback route */}
        <Route path="/callback" element={<SpotifyCallback />} />
        
        {/* Admin routes - same in development and production */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            localStorage.getItem('adminToken') ? 
              <Navigate to="/admin/dashboard" replace /> : 
              <Navigate to="/admin/login" replace />
          }
        />

        {/* Main application routes with Layout */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/records/*" element={<Home />} />
          <Route path="/tech/*" element={<Home />} />
          <Route path="/deep/*" element={<Home />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default AppRouter;
