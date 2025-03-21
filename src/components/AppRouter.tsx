import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './Layout';
import AdminLogin from '../pages/admin/AdminLogin';
import AdminDashboard from '../pages/admin/AdminDashboard';
import Home from './Home';
import SpotifyCallback from './SpotifyCallback';

interface ProtectedRouteProps {
  children: JSX.Element;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('adminToken');
  
  // Simplify the protected route to just check for authentication
  return isAuthenticated ? <>{children}</> : <Navigate to="/admin/login" />;
};

const AppRouter: React.FC = () => {
  // Simplified routing configuration that works in both development and production
  return (
    <Router>
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
              <Navigate to="/admin/dashboard" /> : 
              <Navigate to="/admin/login" />
          }
        />

        {/* Main application routes with Layout */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/records/*" element={<Home />} />
          <Route path="/tech/*" element={<Home />} />
          <Route path="/deep/*" element={<Home />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default AppRouter;
