import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('adminToken');
  
  // Check if we're on the admin subdomain
  const isAdminDomain = window.location.hostname.startsWith('admin.');
  
  if (!isAdminDomain) {
    // Redirect to admin subdomain if trying to access admin routes from main domain
    window.location.href = `https://admin.${window.location.hostname.replace('www.', '')}${window.location.pathname}`;
    return null;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const AppRouter = () => {
  // Check if we're on the admin subdomain
  const isAdminDomain = window.location.hostname.startsWith('admin.');

  if (isAdminDomain) {
    // Admin Routes
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
          {/* Redirect root to dashboard if authenticated, otherwise to login */}
          <Route
            path="/"
            element={
              localStorage.getItem('adminToken') ? 
                <Navigate to="/dashboard" /> : 
                <Navigate to="/login" />
            }
          />
          {/* Catch all route for admin subdomain */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    );
  }

  // Main Application Routes
  return (
    <Router>
      <Routes>
        {/* Add your public routes here */}
        <Route
          path="*"
          element={
            <div>
              <h1>Welcome to Build It Records</h1>
              {/* Add your main application content here */}
            </div>
          }
        />
      </Routes>
    </Router>
  );
};

export default AppRouter;
