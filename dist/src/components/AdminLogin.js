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
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin123' // You should change this in production
};
const AdminLogin = () => {
    const navigate = (0, react_router_dom_1.useNavigate)();
    const [credentials, setCredentials] = (0, react_1.useState)({
        username: '',
        password: '',
    });
    const [error, setError] = (0, react_1.useState)('');
    const handleChange = (e) => {
        const { name, value } = e.target;
        setCredentials(prev => (Object.assign(Object.assign({}, prev), { [name]: value })));
    };
    const handleSubmit = (e) => __awaiter(void 0, void 0, void 0, function* () {
        e.preventDefault();
        setError('');
        // Simple client-side authentication
        if (credentials.username === ADMIN_CREDENTIALS.username &&
            credentials.password === ADMIN_CREDENTIALS.password) {
            // Store authentication state
            localStorage.setItem('isAdmin', 'true');
            localStorage.setItem('adminUsername', credentials.username);
            // Navigate to dashboard
            navigate('/admin/dashboard');
        }
        else {
            setError('Invalid credentials');
        }
    });
    return ((0, jsx_runtime_1.jsx)(material_1.Container, Object.assign({ maxWidth: "sm" }, { children: (0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ sx: { mt: 8 } }, { children: (0, jsx_runtime_1.jsxs)(material_1.Paper, Object.assign({ elevation: 3, sx: { p: 4, backgroundColor: '#282828' } }, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h4", component: "h1", gutterBottom: true, align: "center", sx: { color: '#FFFFFF' } }, { children: "Admin Login" })), error && ((0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ color: "error", align: "center", sx: { mb: 2 } }, { children: error }))), (0, jsx_runtime_1.jsxs)("form", Object.assign({ onSubmit: handleSubmit }, { children: [(0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, margin: "normal", label: "Username", name: "username", value: credentials.username, onChange: handleChange, required: true, sx: {
                                    '& .MuiOutlinedInput-root': {
                                        '& fieldset': {
                                            borderColor: '#666',
                                        },
                                        '&:hover fieldset': {
                                            borderColor: '#999',
                                        },
                                    },
                                    '& .MuiInputLabel-root': {
                                        color: '#999',
                                    },
                                    '& .MuiOutlinedInput-input': {
                                        color: '#FFF',
                                    },
                                } }), (0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, margin: "normal", label: "Password", name: "password", type: "password", value: credentials.password, onChange: handleChange, required: true, sx: {
                                    '& .MuiOutlinedInput-root': {
                                        '& fieldset': {
                                            borderColor: '#666',
                                        },
                                        '&:hover fieldset': {
                                            borderColor: '#999',
                                        },
                                    },
                                    '& .MuiInputLabel-root': {
                                        color: '#999',
                                    },
                                    '& .MuiOutlinedInput-input': {
                                        color: '#FFF',
                                    },
                                } }), (0, jsx_runtime_1.jsx)(material_1.Button, Object.assign({ type: "submit", fullWidth: true, variant: "contained", sx: {
                                    mt: 3,
                                    backgroundColor: '#02FF95',
                                    color: '#121212',
                                    '&:hover': {
                                        backgroundColor: '#00CC76',
                                    },
                                } }, { children: "Login" }))] }))] })) })) })));
};
exports.default = AdminLogin;
