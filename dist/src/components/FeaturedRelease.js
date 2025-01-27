"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const material_1 = require("@mui/material");
const OpenInNew_1 = __importDefault(require("@mui/icons-material/OpenInNew"));
const ThemeContext_1 = require("../contexts/ThemeContext");
const FeaturedRelease = ({ track }) => {
    const { colors } = (0, ThemeContext_1.useTheme)();
    return ((0, jsx_runtime_1.jsxs)(material_1.Card, Object.assign({ sx: {
            display: 'flex',
            backgroundColor: colors.card,
            borderRadius: 2,
            overflow: 'hidden',
            position: 'relative',
        } }, { children: [(0, jsx_runtime_1.jsx)(material_1.CardMedia, { component: "img", sx: {
                    width: 300,
                    objectFit: 'cover',
                }, image: track.artworkUrl || '/default-album-art.png', alt: track.title }), (0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ sx: { display: 'flex', flexDirection: 'column', flexGrow: 1 } }, { children: [(0, jsx_runtime_1.jsxs)(material_1.CardContent, Object.assign({ sx: { flex: '1 0 auto', p: 4, position: 'relative', zIndex: 1 } }, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h4", component: "div", gutterBottom: true, sx: { color: colors.text } }, { children: track.title })), (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h6", color: "textSecondary", gutterBottom: true, sx: { color: colors.textSecondary } }, { children: track.artists.map(artist => artist.name).join(', ') })), track.album && ((0, jsx_runtime_1.jsxs)(material_1.Typography, Object.assign({ variant: "subtitle1", color: "text.secondary", gutterBottom: true, sx: { color: colors.textSecondary } }, { children: ["Album: ", track.album.name] }))), track.releaseDate && ((0, jsx_runtime_1.jsxs)(material_1.Typography, Object.assign({ variant: "body2", color: "text.secondary", sx: { color: colors.textSecondary } }, { children: ["Released: ", new Date(track.releaseDate).toLocaleDateString()] }))), track.label && ((0, jsx_runtime_1.jsxs)(material_1.Typography, Object.assign({ variant: "body2", color: "text.secondary", sx: { color: colors.textSecondary } }, { children: ["Label: ", track.label] })))] })), track.spotifyUrl && ((0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ sx: { p: 2, display: 'flex', alignItems: 'center', pl: 1, pb: 1 } }, { children: (0, jsx_runtime_1.jsxs)(material_1.Link, Object.assign({ href: track.spotifyUrl, target: "_blank", rel: "noopener noreferrer", sx: { display: 'flex', alignItems: 'center', gap: 1 } }, { children: [(0, jsx_runtime_1.jsx)(material_1.IconButton, Object.assign({ size: "small" }, { children: (0, jsx_runtime_1.jsx)(OpenInNew_1.default, {}) })), "Open in Spotify"] })) })))] }))] })));
};
exports.default = FeaturedRelease;
