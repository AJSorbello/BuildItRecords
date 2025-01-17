"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_router_dom_1 = require("react-router-dom");
const AuthService_1 = require("../../services/AuthService");
const ProtectedRoute = ({ children }) => {
    const location = (0, react_router_dom_1.useLocation)();
    if (!AuthService_1.authService.isAuthenticated()) {
        // Redirect to login page but save the attempted URL
        return (0, jsx_runtime_1.jsx)(react_router_dom_1.Navigate, { to: "/admin/login", state: { from: location }, replace: true });
    }
    return (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: children });
};
exports.default = ProtectedRoute;
