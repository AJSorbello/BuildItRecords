"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const material_1 = require("@mui/material");
const react_router_dom_1 = require("react-router-dom");
const NotFoundPage = () => {
    const navigate = (0, react_router_dom_1.useNavigate)();
    const { label = 'records' } = (0, react_router_dom_1.useParams)();
    const labelColors = {
        records: '#02FF95',
        tech: '#FF0000',
        deep: '#00BFFF'
    };
    const color = labelColors[label] || labelColors.records;
    return ((0, jsx_runtime_1.jsx)(material_1.Container, { children: (0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ sx: {
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                color: '#FFFFFF',
                textAlign: 'center'
            } }, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h1", sx: {
                        fontSize: '8rem',
                        fontWeight: 'bold',
                        color: color,
                        mb: 2
                    } }, { children: "404" })), (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h4", sx: {
                        mb: 4,
                        color: '#FFFFFF'
                    } }, { children: "Page Not Found" })), (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h6", gutterBottom: true }, { children: "Looks like you've wandered into uncharted territory" })), (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "body1", sx: {
                        mb: 4,
                        color: 'rgba(255, 255, 255, 0.7)'
                    } }, { children: "The page you're looking for doesn't exist or has been moved." })), (0, jsx_runtime_1.jsx)(material_1.Button, Object.assign({ variant: "contained", onClick: () => navigate(`/${label}`), sx: {
                        bgcolor: color,
                        color: '#121212',
                        '&:hover': {
                            bgcolor: color,
                            opacity: 0.9,
                        },
                    } }, { children: "Return Home" }))] })) }));
};
exports.default = NotFoundPage;
