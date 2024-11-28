import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './Layout';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';
import Home from './Home';
import SpotifyCallback from './SpotifyCallback';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('adminToken');
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment) {
    return isAuthenticated ? <>{children}</> : <Navigate to="/admin/login" />;
  }
  
  const isAdminDomain = window.location.hostname.startsWith('admin.');
  if (!isAdminDomain) {
    window.location.href = `https://admin.${window.location.hostname.replace('www.', '')}${window.location.pathname}`;
    return null;
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const AppRouter: React.FC = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isAdminDomain = window.location.hostname.startsWith('admin.');

  // In development, show all routes
  if (isDevelopment) {
    return (
      <Router>
        <Routes>
          {/* Spotify callback route */}
          <Route path="/callback" element={<SpotifyCallback />} />
          
          {/* Admin routes */}
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
  }

  // Production subdomain-based routing
  if (isAdminDomain) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<AdminLogin />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              localStorage.getItem('adminToken') ? 
                <Navigate to="/dashboard" /> : 
                <Navigate to="/login" />
            }
          />
        </Routes>
      </Router>
    );
  }

  // Main application routes (production)
  return (
    <Router>
      <Routes>
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
