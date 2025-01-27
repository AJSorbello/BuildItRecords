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
const AuthService_1 = require("../../services/AuthService");
const AdminLogin = () => {
    const navigate = (0, react_router_dom_1.useNavigate)();
    const [username, setUsername] = (0, react_1.useState)('');
    const [password, setPassword] = (0, react_1.useState)('');
    const [error, setError] = (0, react_1.useState)(null);
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const handleSubmit = (e) => __awaiter(void 0, void 0, void 0, function* () {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        try {
            yield AuthService_1.authService.login({ username, password });
            navigate('/admin/dashboard');
        }
        catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            }
            else {
                setError('Login failed. Please check your credentials and try again.');
            }
        }
        finally {
            setIsLoading(false);
        }
    });
    return ((0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ sx: {
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#121212'
        } }, { children: (0, jsx_runtime_1.jsx)(material_1.Container, Object.assign({ maxWidth: "sm" }, { children: (0, jsx_runtime_1.jsxs)(material_1.Paper, Object.assign({ elevation: 3, sx: {
                    p: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    backgroundColor: '#1E1E1E'
                } }, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ component: "h1", variant: "h4", sx: {
                            mb: 3,
                            color: '#fff'
                        } }, { children: "Admin Login" })), error && ((0, jsx_runtime_1.jsx)(material_1.Alert, Object.assign({ severity: "error", sx: { width: '100%', mt: 2 } }, { children: error }))), (0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ component: "form", onSubmit: handleSubmit, sx: { mt: 1, width: '100%' } }, { children: [(0, jsx_runtime_1.jsx)(material_1.TextField, { margin: "normal", required: true, fullWidth: true, id: "username", label: "Username", name: "username", autoComplete: "username", autoFocus: true, value: username, onChange: (e) => setUsername(e.target.value), disabled: isLoading, sx: {
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
                                        color: '#fff',
                                    },
                                } }), (0, jsx_runtime_1.jsx)(material_1.TextField, { margin: "normal", required: true, fullWidth: true, name: "password", label: "Password", type: "password", id: "password", autoComplete: "current-password", value: password, onChange: (e) => setPassword(e.target.value), disabled: isLoading, sx: {
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
                                        color: '#fff',
                                    },
                                } }), (0, jsx_runtime_1.jsx)(material_1.Button, Object.assign({ type: "submit", fullWidth: true, variant: "contained", sx: { mt: 3, mb: 2 }, disabled: isLoading }, { children: isLoading ? (0, jsx_runtime_1.jsx)(material_1.CircularProgress, { size: 24 }) : 'Sign In' }))] }))] })) })) })));
};
exports.default = AdminLogin;
