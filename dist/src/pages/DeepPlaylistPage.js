"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importDefault(require("react"));
const material_1 = require("@mui/material");
const PageLayout_1 = __importDefault(require("../components/PageLayout"));
const DeepSidebar_1 = __importDefault(require("../components/DeepSidebar"));
const useSpotifyPlaylists_1 = require("../hooks/useSpotifyPlaylists");
const DeepPlaylistPage = () => {
    const { playlists, loading, error } = (0, useSpotifyPlaylists_1.useSpotifyPlaylists)('deep');
    const theme = (0, material_1.useTheme)();
    const isMobile = (0, material_1.useMediaQuery)('(max-width:900px)');
    const [mobileOpen, setMobileOpen] = react_1.default.useState(false);
    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };
    return ((0, jsx_runtime_1.jsx)(PageLayout_1.default, Object.assign({ label: "deep" }, { children: (0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ sx: { display: 'flex', height: 'calc(100vh - 64px)' } }, { children: [(0, jsx_runtime_1.jsx)(DeepSidebar_1.default, { variant: isMobile ? "temporary" : "permanent", open: isMobile ? mobileOpen : true, onClose: handleDrawerToggle }), (0, jsx_runtime_1.jsx)(material_1.Box, { component: "main", sx: {
                        flexGrow: 1,
                        bgcolor: '#121212',
                        color: '#FFFFFF',
                        p: 3,
                        overflow: 'auto'
                    } })] })) })));
};
exports.default = DeepPlaylistPage;
