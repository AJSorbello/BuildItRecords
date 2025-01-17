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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const axios_1 = __importDefault(require("axios"));
const material_1 = require("@mui/material");
const config_1 = require("../config"); // assuming config file is in the parent directory
const Home = () => {
    const [tracks, setTracks] = (0, react_1.useState)([]);
    const [category, setCategory] = (0, react_1.useState)('all');
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)('');
    (0, react_1.useEffect)(() => {
        fetchTracks();
    }, []);
    const fetchTracks = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            setLoading(true);
            const response = yield axios_1.default.get(`${config_1.API_URL}/track-management/tracks`);
            setTracks(response.data.tracks || []);
            setLoading(false);
        }
        catch (err) {
            setError('Failed to fetch tracks');
            setLoading(false);
        }
    });
    const handleCategoryChange = (event, newValue) => {
        setCategory(newValue);
    };
    const filteredTracks = category === 'all'
        ? tracks
        : tracks.filter(track => track.category === category);
    if (loading) {
        return ((0, jsx_runtime_1.jsx)(material_1.Typography, { children: "Loading..." }));
    }
    if (error) {
        return ((0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ color: "error" }, { children: error })));
    }
    return ((0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ sx: { width: '100%' } }, { children: [(0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ sx: { borderBottom: 1, borderColor: 'divider', mb: 4 } }, { children: (0, jsx_runtime_1.jsxs)(material_1.Tabs, Object.assign({ value: category, onChange: handleCategoryChange, variant: "scrollable", scrollButtons: "auto", sx: {
                        '& .MuiTabs-indicator': {
                            backgroundColor: '#02FF95',
                        },
                        '& .MuiTab-root': {
                            color: '#FFFFFF',
                            '&.Mui-selected': {
                                color: '#02FF95',
                            },
                        },
                    } }, { children: [(0, jsx_runtime_1.jsx)(material_1.Tab, { label: "All", value: "all" }), (0, jsx_runtime_1.jsx)(material_1.Tab, { label: "Featured", value: "Featured" }), (0, jsx_runtime_1.jsx)(material_1.Tab, { label: "New Release", value: "New Release" }), (0, jsx_runtime_1.jsx)(material_1.Tab, { label: "Popular", value: "Popular" }), (0, jsx_runtime_1.jsx)(material_1.Tab, { label: "Recommended", value: "Recommended" })] })) })), (0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ container: true, spacing: 4 }, { children: filteredTracks.map((track) => ((0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12, sm: 6, md: 4 }, { children: (0, jsx_runtime_1.jsxs)(material_1.Card, Object.assign({ sx: {
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            transition: 'transform 0.2s',
                            backgroundColor: '#282828',
                            '&:hover': {
                                transform: 'scale(1.02)',
                                backgroundColor: '#383838',
                            },
                        } }, { children: [(0, jsx_runtime_1.jsx)(material_1.CardMedia, { component: "img", sx: {
                                    height: 250,
                                    objectFit: 'cover',
                                }, image: track.albumArt || 'https://via.placeholder.com/300', alt: track.name }), (0, jsx_runtime_1.jsxs)(material_1.CardContent, Object.assign({ sx: { flexGrow: 1 } }, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ gutterBottom: true, variant: "h6", component: "h2", sx: { color: '#FFFFFF' } }, { children: track.name })), (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ sx: { color: '#B3B3B3' } }, { children: track.artist })), (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "body2", sx: { color: '#B3B3B3' } }, { children: track.album })), (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "caption", sx: {
                                            display: 'inline-block',
                                            mt: 1,
                                            backgroundColor: '#02FF95',
                                            color: '#121212',
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                        } }, { children: track.category }))] }))] })) }), track.id))) }))] })));
};
exports.default = Home;
