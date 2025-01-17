"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlaylistCard = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const material_1 = require("@mui/material");
const MusicNote_1 = __importDefault(require("@mui/icons-material/MusicNote"));
const PlayArrow_1 = __importDefault(require("@mui/icons-material/PlayArrow"));
const AccessTime_1 = __importDefault(require("@mui/icons-material/AccessTime"));
const PlaylistCard = ({ title, description, imageUrl, spotifyUrl, trackCount, duration, tags = [], label, }) => {
    const labelColors = {
        records: '#02FF95',
        tech: '#FF0000',
        deep: '#00BFFF'
    };
    const color = labelColors[label];
    return ((0, jsx_runtime_1.jsxs)(material_1.Card, Object.assign({ sx: {
            maxWidth: 345,
            bgcolor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: 2,
            transition: 'transform 0.2s ease-in-out',
            '&:hover': {
                transform: 'scale(1.02)',
            },
        } }, { children: [(0, jsx_runtime_1.jsx)(material_1.CardMedia, { component: "img", height: "345", image: imageUrl, alt: title, sx: {
                    objectFit: 'cover',
                } }), (0, jsx_runtime_1.jsxs)(material_1.CardContent, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ gutterBottom: true, variant: "h6", component: "div", sx: {
                            color: '#FFFFFF',
                            fontWeight: 'bold',
                        } }, { children: title })), (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "body2", sx: {
                            color: 'rgba(255, 255, 255, 0.7)',
                            mb: 2,
                            minHeight: '3em',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        } }, { children: description })), (0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ sx: {
                            display: 'flex',
                            gap: 2,
                            mb: 2,
                            color: 'rgba(255, 255, 255, 0.7)',
                        } }, { children: [(0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ sx: { display: 'flex', alignItems: 'center', gap: 0.5 } }, { children: [(0, jsx_runtime_1.jsx)(PlayArrow_1.default, { fontSize: "small" }), (0, jsx_runtime_1.jsxs)(material_1.Typography, Object.assign({ variant: "body2" }, { children: [trackCount, " tracks"] }))] })), (0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ sx: { display: 'flex', alignItems: 'center', gap: 0.5 } }, { children: [(0, jsx_runtime_1.jsx)(AccessTime_1.default, { fontSize: "small" }), (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "body2" }, { children: duration }))] }))] })), tags.length > 0 && ((0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ sx: { mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 } }, { children: tags.map((tag) => ((0, jsx_runtime_1.jsx)(material_1.Chip, { label: tag, size: "small", sx: {
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                color: '#FFFFFF',
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                },
                            } }, tag))) }))), (0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ sx: {
                            display: 'flex',
                            justifyContent: 'center',
                        } }, { children: (0, jsx_runtime_1.jsx)(material_1.IconButton, Object.assign({ component: material_1.Link, href: spotifyUrl, target: "_blank", rel: "noopener noreferrer", sx: {
                                color: '#FFFFFF',
                                '&:hover': {
                                    color: color,
                                },
                            } }, { children: (0, jsx_runtime_1.jsx)(MusicNote_1.default, {}) })) }))] })] })));
};
exports.PlaylistCard = PlaylistCard;
