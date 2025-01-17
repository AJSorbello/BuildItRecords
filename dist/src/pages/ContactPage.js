"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const material_1 = require("@mui/material");
const react_router_dom_1 = require("react-router-dom");
const PageLayout_1 = __importDefault(require("../components/PageLayout"));
const ContactPage = () => {
    const { label = 'records' } = (0, react_router_dom_1.useParams)();
    const labelInfo = {
        records: {
            title: 'Build It Records',
            email: 'contact@builditrecords.com',
            color: '#02FF95'
        },
        tech: {
            title: 'Build It Tech',
            email: 'contact@buildittechrecords.com',
            color: '#FF0000'
        },
        deep: {
            title: 'Build It Deep',
            email: 'contact@builditdeeprecords.com',
            color: '#00BFFF'
        }
    };
    const info = labelInfo[label];
    const handleSubmit = (event) => {
        event.preventDefault();
        // Handle form submission
    };
    return ((0, jsx_runtime_1.jsx)(PageLayout_1.default, Object.assign({ label: label }, { children: (0, jsx_runtime_1.jsx)(material_1.Container, Object.assign({ maxWidth: "md", sx: { py: 8 } }, { children: (0, jsx_runtime_1.jsxs)(material_1.Paper, Object.assign({ elevation: 0, sx: {
                    p: 4,
                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                    color: '#FFFFFF'
                } }, { children: [(0, jsx_runtime_1.jsxs)(material_1.Typography, Object.assign({ variant: "h3", gutterBottom: true, sx: {
                            color: info.color,
                            fontWeight: 'bold',
                            mb: 4
                        } }, { children: ["Contact ", info.title] })), (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h6", paragraph: true }, { children: "Get in touch with us for any inquiries or feedback." })), (0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ component: "form", onSubmit: handleSubmit, sx: { mt: 4 } }, { children: (0, jsx_runtime_1.jsxs)(material_1.Grid, Object.assign({ container: true, spacing: 3 }, { children: [(0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12, sm: 6 }, { children: (0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, label: "Name", required: true, sx: {
                                            '& .MuiOutlinedInput-root': {
                                                '& fieldset': {
                                                    borderColor: 'rgba(255, 255, 255, 0.23)',
                                                },
                                                '&:hover fieldset': {
                                                    borderColor: info.color,
                                                },
                                            },
                                            '& .MuiInputLabel-root': {
                                                color: 'rgba(255, 255, 255, 0.7)',
                                            },
                                            '& .MuiInputBase-input': {
                                                color: '#FFFFFF',
                                            },
                                        } }) })), (0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12, sm: 6 }, { children: (0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, label: "Email", type: "email", required: true, sx: {
                                            '& .MuiOutlinedInput-root': {
                                                '& fieldset': {
                                                    borderColor: 'rgba(255, 255, 255, 0.23)',
                                                },
                                                '&:hover fieldset': {
                                                    borderColor: info.color,
                                                },
                                            },
                                            '& .MuiInputLabel-root': {
                                                color: 'rgba(255, 255, 255, 0.7)',
                                            },
                                            '& .MuiInputBase-input': {
                                                color: '#FFFFFF',
                                            },
                                        } }) })), (0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12 }, { children: (0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, label: "Subject", required: true, sx: {
                                            '& .MuiOutlinedInput-root': {
                                                '& fieldset': {
                                                    borderColor: 'rgba(255, 255, 255, 0.23)',
                                                },
                                                '&:hover fieldset': {
                                                    borderColor: info.color,
                                                },
                                            },
                                            '& .MuiInputLabel-root': {
                                                color: 'rgba(255, 255, 255, 0.7)',
                                            },
                                            '& .MuiInputBase-input': {
                                                color: '#FFFFFF',
                                            },
                                        } }) })), (0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12 }, { children: (0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, label: "Message", multiline: true, rows: 4, required: true, sx: {
                                            '& .MuiOutlinedInput-root': {
                                                '& fieldset': {
                                                    borderColor: 'rgba(255, 255, 255, 0.23)',
                                                },
                                                '&:hover fieldset': {
                                                    borderColor: info.color,
                                                },
                                            },
                                            '& .MuiInputLabel-root': {
                                                color: 'rgba(255, 255, 255, 0.7)',
                                            },
                                            '& .MuiInputBase-input': {
                                                color: '#FFFFFF',
                                            },
                                        } }) })), (0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12 }, { children: (0, jsx_runtime_1.jsx)(material_1.Button, Object.assign({ type: "submit", variant: "contained", size: "large", sx: {
                                            bgcolor: info.color,
                                            color: '#121212',
                                            '&:hover': {
                                                bgcolor: info.color,
                                                opacity: 0.9,
                                            },
                                        } }, { children: "Send Message" })) }))] })) })), (0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ sx: { mt: 6 } }, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h6", gutterBottom: true, sx: { color: info.color } }, { children: "Direct Contact" })), (0, jsx_runtime_1.jsxs)(material_1.Typography, { children: ["Email: ", info.email] })] }))] })) })) })));
};
exports.default = ContactPage;
