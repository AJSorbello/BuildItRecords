"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const material_1 = require("@mui/material");
const react_router_dom_1 = require("react-router-dom");
const PageLayout_1 = __importDefault(require("../components/PageLayout"));
const AboutPage = () => {
    const { label = 'records' } = (0, react_router_dom_1.useParams)();
    const labelInfo = {
        records: {
            title: 'Build It Records',
            description: 'Underground house music label focused on quality deep and tech house releases.',
            color: '#02FF95'
        },
        tech: {
            title: 'Build It Tech',
            description: 'Cutting-edge techno and tech house imprint pushing musical boundaries.',
            color: '#FF0000'
        },
        deep: {
            title: 'Build It Deep',
            description: 'Deep and melodic house music celebrating atmospheric and emotional soundscapes.',
            color: '#00BFFF'
        }
    };
    const info = labelInfo[label];
    return ((0, jsx_runtime_1.jsx)(PageLayout_1.default, Object.assign({ label: label }, { children: (0, jsx_runtime_1.jsx)(material_1.Container, Object.assign({ maxWidth: "lg", sx: { py: 8 } }, { children: (0, jsx_runtime_1.jsxs)(material_1.Paper, Object.assign({ elevation: 0, sx: {
                    p: 4,
                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                    color: '#FFFFFF'
                } }, { children: [(0, jsx_runtime_1.jsxs)(material_1.Typography, Object.assign({ variant: "h3", gutterBottom: true, sx: {
                            color: info.color,
                            fontWeight: 'bold',
                            mb: 4
                        } }, { children: ["About ", info.title] })), (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h6", paragraph: true }, { children: info.description })), (0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ sx: { mt: 4 } }, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h5", gutterBottom: true, sx: { color: info.color } }, { children: "Our Mission" })), (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "body1", sx: { mb: 2 } }, { children: "We're passionate about underground house music" })), (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ paragraph: true }, { children: "Our commitment to quality and innovation drives us to push boundaries and create unique sonic experiences." }))] })), (0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ sx: { mt: 4 } }, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h5", gutterBottom: true, sx: { color: info.color } }, { children: "Label Philosophy" })), (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ paragraph: true }, { children: "We believe in fostering a collaborative environment where artists can freely express their creativity while maintaining the highest standards of production quality. Our releases are carefully curated to ensure each track contributes something special to the electronic music landscape." }))] })), (0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ sx: { mt: 4 } }, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h5", gutterBottom: true, sx: { color: info.color } }, { children: "Join Our Community" })), (0, jsx_runtime_1.jsx)(material_1.Typography, { children: "Whether you're an artist looking to release music or a fan seeking the latest underground sounds, we welcome you to be part of our growing community. Follow us on social media and subscribe to our newsletter to stay updated with our latest releases and events." })] }))] })) })) })));
};
exports.default = AboutPage;
