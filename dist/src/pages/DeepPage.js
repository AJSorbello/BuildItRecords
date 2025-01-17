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
const material_1 = require("@mui/material");
const react_router_dom_1 = require("react-router-dom");
const styles_1 = require("@mui/material/styles");
const icons_material_1 = require("@mui/icons-material");
const labels_1 = require("../constants/labels");
const DatabaseService_1 = require("../services/DatabaseService");
const PageLayout_1 = __importDefault(require("../components/PageLayout"));
const IconLink = (0, styles_1.styled)(react_router_dom_1.Link)({
    color: '#FFFFFF',
    marginRight: '10px',
    '&:hover': {
        color: '#1DB954',
    },
});
const DeepPage = () => {
    const [artists, setArtists] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        const fetchData = () => __awaiter(void 0, void 0, void 0, function* () {
            try {
                setLoading(true);
                // Fetch artists
                const deepArtists = yield DatabaseService_1.databaseService.getArtistsForLabel(labels_1.RECORD_LABELS['buildit-deep']);
                if (deepArtists.length === 0) {
                    setError('No artists found');
                    return;
                }
                setArtists(deepArtists);
            }
            catch (err) {
                console.error('Error fetching data:', err);
                setError('Failed to load data');
            }
            finally {
                setLoading(false);
            }
        });
        fetchData();
    }, []);
    if (loading) {
        return ((0, jsx_runtime_1.jsx)(PageLayout_1.default, Object.assign({ label: "deep" }, { children: (0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }, { children: (0, jsx_runtime_1.jsx)(material_1.CircularProgress, {}) })) })));
    }
    if (error) {
        return ((0, jsx_runtime_1.jsx)(PageLayout_1.default, Object.assign({ label: "deep" }, { children: (0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }, { children: (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ color: "error" }, { children: error })) })) })));
    }
    return ((0, jsx_runtime_1.jsx)(PageLayout_1.default, Object.assign({ label: "deep" }, { children: (0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ sx: { flexGrow: 1, p: 3 } }, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h4", gutterBottom: true }, { children: "Build It Deep Artists" })), (0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ container: true, spacing: 4 }, { children: artists.map((artist) => ((0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12, sm: 6, md: 4 }, { children: (0, jsx_runtime_1.jsx)(material_1.Card, { children: (0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ sx: { position: 'relative' } }, { children: [artist.images.map((image, index) => ((0, jsx_runtime_1.jsx)(material_1.CardMedia, { component: "img", height: "200", image: image.url || 'https://via.placeholder.com/200', alt: artist.name }, index))), (0, jsx_runtime_1.jsxs)(material_1.CardContent, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h6", component: "div" }, { children: artist.name })), (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "body2", color: "text.secondary", sx: {
                                                    height: '3em',
                                                    overflow: 'hidden',
                                                    mb: 2
                                                } }, { children: artist.bio || `Artist on ${labels_1.RECORD_LABELS['buildit-deep'].displayName}` })), (0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ sx: {
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center'
                                                } }, { children: (0, jsx_runtime_1.jsx)(material_1.Box, { children: artist.spotifyUrl && ((0, jsx_runtime_1.jsx)(material_1.Link, Object.assign({ href: artist.spotifyUrl, target: "_blank", rel: "noopener noreferrer" }, { children: (0, jsx_runtime_1.jsx)(material_1.IconButton, Object.assign({ size: "small" }, { children: (0, jsx_runtime_1.jsx)(icons_material_1.OpenInNew, {}) })) }))) }) }))] })] })) }) }), artist.id))) }))] })) })));
};
exports.default = DeepPage;
