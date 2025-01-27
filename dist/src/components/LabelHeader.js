"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const material_1 = require("@mui/material");
const MusicNote_1 = __importDefault(require("@mui/icons-material/MusicNote"));
const CloudQueue_1 = __importDefault(require("@mui/icons-material/CloudQueue"));
const People_1 = __importDefault(require("@mui/icons-material/People"));
const ThemeContext_1 = require("../contexts/ThemeContext");
const react_router_dom_1 = require("react-router-dom");
const BeatportIcon_1 = __importDefault(require("../assets/icons/BeatportIcon"));
const LabelHeader = ({ label, platformLinks }) => {
    const { colors } = (0, ThemeContext_1.useTheme)();
    const navigate = (0, react_router_dom_1.useNavigate)();
    const handlePlatformPress = (url) => {
        window.open(url, '_blank', 'noopener,noreferrer');
    };
    const handleArtistsPress = () => {
        navigate('/artists');
    };
    return ((0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ sx: {
            padding: '10px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            backgroundColor: colors.card
        } }, { children: (0, jsx_runtime_1.jsxs)(material_1.Stack, Object.assign({ direction: "row", spacing: 2, sx: { flexWrap: 'wrap', justifyContent: 'space-around' } }, { children: [(0, jsx_runtime_1.jsx)(material_1.Button, Object.assign({ variant: "contained", startIcon: (0, jsx_runtime_1.jsx)(MusicNote_1.default, {}), onClick: () => handlePlatformPress(platformLinks.spotify), sx: {
                        backgroundColor: '#1DB954',
                        color: '#FFFFFF',
                        '&:hover': {
                            backgroundColor: '#1aa34a'
                        }
                    } }, { children: "Spotify" })), (0, jsx_runtime_1.jsx)(material_1.Button, Object.assign({ variant: "contained", startIcon: (0, jsx_runtime_1.jsx)(BeatportIcon_1.default, {}), onClick: () => handlePlatformPress(platformLinks.beatport), sx: {
                        backgroundColor: '#FF6B00',
                        color: '#FFFFFF',
                        '&:hover': {
                            backgroundColor: '#e66000'
                        }
                    } }, { children: "Beatport" })), (0, jsx_runtime_1.jsx)(material_1.Button, Object.assign({ variant: "contained", startIcon: (0, jsx_runtime_1.jsx)(CloudQueue_1.default, {}), onClick: () => handlePlatformPress(platformLinks.soundcloud), sx: {
                        backgroundColor: '#FF7700',
                        color: '#FFFFFF',
                        '&:hover': {
                            backgroundColor: '#e66a00'
                        }
                    } }, { children: "SoundCloud" })), (0, jsx_runtime_1.jsx)(material_1.Button, Object.assign({ variant: "contained", startIcon: (0, jsx_runtime_1.jsx)(People_1.default, {}), onClick: handleArtistsPress, sx: {
                        backgroundColor: colors.primary,
                        color: '#FFFFFF',
                        '&:hover': {
                            backgroundColor: '#1aa34a'
                        }
                    } }, { children: "Artists" }))] })) })));
};
exports.default = LabelHeader;
