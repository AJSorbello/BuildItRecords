"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_router_dom_1 = require("react-router-dom");
const Layout_1 = require("./Layout");
const AdminLogin_1 = __importDefault(require("../pages/admin/AdminLogin"));
const AdminDashboard_1 = __importDefault(require("../pages/admin/AdminDashboard"));
const Home_1 = __importDefault(require("./Home"));
const SpotifyCallback_1 = __importDefault(require("./SpotifyCallback"));
const ProtectedRoute = ({ children }) => {
    const isAuthenticated = !!localStorage.getItem('adminToken');
    const isDevelopment = process.env.NODE_ENV === 'development';
    if (isDevelopment) {
        return isAuthenticated ? (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: children }) : (0, jsx_runtime_1.jsx)(react_router_dom_1.Navigate, { to: "/admin/login" });
    }
    const isAdminDomain = window.location.hostname.startsWith('admin.');
    if (!isAdminDomain) {
        window.location.href = `https://admin.${window.location.hostname.replace('www.', '')}${window.location.pathname}`;
        return null;
    }
    return isAuthenticated ? (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: children }) : (0, jsx_runtime_1.jsx)(react_router_dom_1.Navigate, { to: "/login" });
};
const AppRouter = () => {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isAdminDomain = window.location.hostname.startsWith('admin.');
    // In development, show all routes
    if (isDevelopment) {
        return ((0, jsx_runtime_1.jsx)(react_router_dom_1.BrowserRouter, { children: (0, jsx_runtime_1.jsxs)(react_router_dom_1.Routes, { children: [(0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/callback", element: (0, jsx_runtime_1.jsx)(SpotifyCallback_1.default, {}) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/admin/login", element: (0, jsx_runtime_1.jsx)(AdminLogin_1.default, {}) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/admin/dashboard", element: (0, jsx_runtime_1.jsx)(ProtectedRoute, { children: (0, jsx_runtime_1.jsx)(AdminDashboard_1.default, {}) }) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/admin", element: localStorage.getItem('adminToken') ?
                            (0, jsx_runtime_1.jsx)(react_router_dom_1.Navigate, { to: "/admin/dashboard" }) :
                            (0, jsx_runtime_1.jsx)(react_router_dom_1.Navigate, { to: "/admin/login" }) }), (0, jsx_runtime_1.jsxs)(react_router_dom_1.Route, Object.assign({ element: (0, jsx_runtime_1.jsx)(Layout_1.Layout, {}) }, { children: [(0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/", element: (0, jsx_runtime_1.jsx)(Home_1.default, {}) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/records/*", element: (0, jsx_runtime_1.jsx)(Home_1.default, {}) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/tech/*", element: (0, jsx_runtime_1.jsx)(Home_1.default, {}) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/deep/*", element: (0, jsx_runtime_1.jsx)(Home_1.default, {}) })] }))] }) }));
    }
    // Production subdomain-based routing
    if (isAdminDomain) {
        return ((0, jsx_runtime_1.jsx)(react_router_dom_1.BrowserRouter, { children: (0, jsx_runtime_1.jsxs)(react_router_dom_1.Routes, { children: [(0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/login", element: (0, jsx_runtime_1.jsx)(AdminLogin_1.default, {}) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/dashboard", element: (0, jsx_runtime_1.jsx)(ProtectedRoute, { children: (0, jsx_runtime_1.jsx)(AdminDashboard_1.default, {}) }) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/", element: localStorage.getItem('adminToken') ?
                            (0, jsx_runtime_1.jsx)(react_router_dom_1.Navigate, { to: "/dashboard" }) :
                            (0, jsx_runtime_1.jsx)(react_router_dom_1.Navigate, { to: "/login" }) })] }) }));
    }
    // Main application routes (production)
    return ((0, jsx_runtime_1.jsx)(react_router_dom_1.BrowserRouter, { children: (0, jsx_runtime_1.jsx)(react_router_dom_1.Routes, { children: (0, jsx_runtime_1.jsxs)(react_router_dom_1.Route, Object.assign({ element: (0, jsx_runtime_1.jsx)(Layout_1.Layout, {}) }, { children: [(0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/", element: (0, jsx_runtime_1.jsx)(Home_1.default, {}) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/records/*", element: (0, jsx_runtime_1.jsx)(Home_1.default, {}) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/tech/*", element: (0, jsx_runtime_1.jsx)(Home_1.default, {}) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/deep/*", element: (0, jsx_runtime_1.jsx)(Home_1.default, {}) })] })) }) }));
};
exports.default = AppRouter;
