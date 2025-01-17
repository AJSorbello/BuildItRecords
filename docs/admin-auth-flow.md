# Admin Authentication Flow

## Overview
This document describes the working authentication flow from AdminLogin to AdminDashboard, including all relevant files and endpoints.

## Frontend Components

### AdminLogin Component
- **Path**: `/src/pages/admin/AdminLogin.tsx`
- **Route**: `/admin/login`
- **Functionality**: 
  - Handles login form submission
  - Stores token and username in localStorage
  - Verifies token before redirecting
  - Redirects to dashboard on success

### AdminDashboard Component
- **Path**: `/src/pages/admin/AdminDashboard.tsx`
- **Route**: `/admin/dashboard`
- **Protection**: Protected by `ProtectedRoute` component

## Backend Routes

### Login Endpoint
- **Path**: `/server/routes/admin.js`
- **Route**: `POST /api/admin/login`
- **Request Format**:
  ```json
  {
    "username": "admin",
    "password": "admin123"
  }
  ```
- **Success Response**:
  ```json
  {
    "success": true,
    "data": {
      "token": "jwt_token_here"
    },
    "message": "Login successful"
  }
  ```

### Token Verification Endpoint
- **Path**: `/server/routes/admin.js`
- **Route**: `GET /api/admin/verify-admin-token`
- **Headers Required**: 
  ```
  Authorization: Bearer <token>
  Content-Type: application/json
  ```
- **Success Response**:
  ```json
  {
    "verified": true,
    "message": "Token verified"
  }
  ```

## Service Layer

### DatabaseService
- **Path**: `/src/services/DatabaseService.ts`
- **Key Methods**:
  - `adminLogin(username: string, password: string)`
  - `verifyAdminToken()`

## Authentication Flow
1. User submits login form at `/admin/login`
2. Frontend calls `DatabaseService.adminLogin()` with credentials
3. Backend validates credentials and returns JWT token
4. Frontend stores token in localStorage
5. Frontend calls `DatabaseService.verifyAdminToken()` to verify token
6. On successful verification, user is redirected to `/admin/dashboard`

## Working Configuration
- Frontend base URL: `http://localhost:3000`
- Backend API URL: `http://localhost:3001/api`
- Environment variables required:
  - `REACT_APP_API_URL`
  - `JWT_SECRET` (server-side)
  - `ADMIN_USERNAME` (server-side)
  - `ADMIN_PASSWORD_HASH` (server-side)

Last verified working: January 15, 2025
