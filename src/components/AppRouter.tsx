import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
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

// Fallback component for handling 404 pages - will redirect to home
const FallbackRedirect = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    console.log('404 route hit - redirecting to home');
    navigate('/', { replace: true });
  }, [navigate]);
  
  return <div>Redirecting...</div>;
};

interface ProtectedRouteProps {
  children: JSX.Element;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('adminToken');
  const location = useLocation();
  
  console.log('ProtectedRoute - Auth state:', isAuthenticated, 'Path:', location.pathname);
  
  // Store the attempted URL to redirect back after login
  useEffect(() => {
    if (!isAuthenticated) {
      sessionStorage.setItem('redirectAfterLogin', location.pathname);
    }
  }, [isAuthenticated, location.pathname]);
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/admin/login" replace state={{ from: location }} />;
};

const AppRouter: React.FC = () => {
  // Log on initial load for debugging
  useEffect(() => {
    console.log('AppRouter mounted. Current path:', window.location.pathname);
    console.log('Authentication state:', !!localStorage.getItem('adminToken'));
  }, []);

  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* Spotify callback route */}
        <Route path="/callback" element={<SpotifyCallback />} />
        
        {/* Admin routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin/dashboard/*"
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
          <Route index element={<Home />} />
          <Route path="/records/*" element={<Home />} />
          <Route path="/tech/*" element={<Home />} />
          <Route path="/deep/*" element={<Home />} />
          {/* Add a wildcard route at the end to catch all other routes */}
          <Route path="*" element={<FallbackRedirect />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default AppRouter;
