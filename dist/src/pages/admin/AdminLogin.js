"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_router_dom_1 = require("react-router-dom");
const material_1 = require("@mui/material");
const DatabaseService_1 = require("../../services/DatabaseService");
const AdminLogin = () => {
    const navigate = (0, react_router_dom_1.useNavigate)();
    const [username, setUsername] = (0, react_1.useState)('');
    const [password, setPassword] = (0, react_1.useState)('');
    const [error, setError] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const handleLogin = (e) => __awaiter(void 0, void 0, void 0, function* () {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const response = yield DatabaseService_1.databaseService.adminLogin(username, password);
            console.log('Login response:', response);
            if (!response.token) {
                throw new Error('No token received from server');
            }
            try {
                // Verify the token
                const verified = yield DatabaseService_1.databaseService.verifyAdminToken();
                if (!verified.verified) {
                    throw new Error('Token verification failed');
                }
                // Navigate to dashboard
                navigate('/admin/dashboard');
            }
            catch (verifyError) {
                console.error('Token verification failed:', verifyError);
                throw new Error('Token verification failed');
            }
        }
        catch (error) {
            console.error('Login error:', error);
            setError(error instanceof Error ? error.message : 'Login failed');
        }
        finally {
            setLoading(false);
        }
    });
    return ((0, jsx_runtime_1.jsx)(material_1.Container, Object.assign({ maxWidth: "sm", sx: { mt: 8 } }, { children: (0, jsx_runtime_1.jsxs)(material_1.Paper, Object.assign({ elevation: 3, sx: { p: 4 } }, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h4", component: "h1", gutterBottom: true, align: "center" }, { children: "Admin Login" })), error && ((0, jsx_runtime_1.jsx)(material_1.Alert, Object.assign({ severity: "error", sx: { mb: 2 } }, { children: error }))), (0, jsx_runtime_1.jsxs)("form", Object.assign({ onSubmit: handleLogin }, { children: [(0, jsx_runtime_1.jsx)(material_1.TextField, { label: "Username", variant: "outlined", fullWidth: true, margin: "normal", value: username, onChange: (e) => setUsername(e.target.value), disabled: loading, required: true }), (0, jsx_runtime_1.jsx)(material_1.TextField, { label: "Password", type: "password", variant: "outlined", fullWidth: true, margin: "normal", value: password, onChange: (e) => setPassword(e.target.value), disabled: loading, required: true }), (0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ sx: { mt: 3 } }, { children: (0, jsx_runtime_1.jsx)(material_1.Button, Object.assign({ type: "submit", variant: "contained", color: "primary", fullWidth: true, disabled: loading }, { children: loading ? 'Logging in...' : 'Login' })) }))] }))] })) })));
};
exports.default = AdminLogin;
