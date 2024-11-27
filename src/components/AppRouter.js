import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('adminToken');
  return isAuthenticated ? children : <Navigate to="/admin/login" />;
};

const AppRouter = () => {
  return (
    <Router>
      <Routes>
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
        
        {/* Add your existing routes here */}
        
        {/* Redirect /admin to dashboard if authenticated, otherwise to login */}
        <Route
          path="/admin"
          element={
            localStorage.getItem('adminToken') ? 
              <Navigate to="/admin/dashboard" /> : 
              <Navigate to="/admin/login" />
          }
        />
      </Routes>
    </Router>
  );
};

export default AppRouter;
