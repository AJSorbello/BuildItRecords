"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const material_1 = require("@mui/material");
const icons_material_1 = require("@mui/icons-material");
const SpotifyTrackList_1 = __importDefault(require("./SpotifyTrackList"));
const SpotifySearch = () => {
    const [searchQuery, setSearchQuery] = (0, react_1.useState)('');
    const [debouncedQuery, setDebouncedQuery] = (0, react_1.useState)('');
    // Debounce search input to avoid too many API calls
    const handleSearchChange = (event) => {
        const query = event.target.value;
        setSearchQuery(query);
        // Clear existing timeout
        if (window.searchTimeout) {
            clearTimeout(window.searchTimeout);
        }
        // Set new timeout
        window.searchTimeout = setTimeout(() => {
            setDebouncedQuery(query);
        }, 500);
    };
    return ((0, jsx_runtime_1.jsx)(material_1.Container, Object.assign({ maxWidth: "lg" }, { children: (0, jsx_runtime_1.jsxs)(material_1.Paper, Object.assign({ elevation: 3, sx: { p: 4, my: 4 } }, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h4", component: "h1", gutterBottom: true, align: "center" }, { children: "Music Search" })), (0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ sx: { mb: 4 } }, { children: (0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, variant: "outlined", placeholder: "Search for songs, artists, or albums...", value: searchQuery, onChange: handleSearchChange, InputProps: {
                            startAdornment: ((0, jsx_runtime_1.jsx)(material_1.InputAdornment, Object.assign({ position: "start" }, { children: (0, jsx_runtime_1.jsx)(icons_material_1.Search, {}) }))),
                        }, sx: {
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                backgroundColor: 'background.paper',
                            }
                        } }) })), debouncedQuery && ((0, jsx_runtime_1.jsxs)(material_1.Box, { children: [(0, jsx_runtime_1.jsxs)(material_1.Typography, Object.assign({ variant: "h6", gutterBottom: true }, { children: ["Results for \"", debouncedQuery, "\""] })), (0, jsx_runtime_1.jsx)(SpotifyTrackList_1.default, { searchQuery: debouncedQuery })] }))] })) })));
};
exports.default = SpotifySearch;
