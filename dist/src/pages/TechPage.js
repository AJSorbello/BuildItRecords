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
const icons_material_1 = require("@mui/icons-material");
const DatabaseService_1 = require("../services/DatabaseService");
const PageLayout_1 = __importDefault(require("../components/PageLayout"));
const ThemeContext_1 = require("../contexts/ThemeContext");
const TechSidebar_1 = __importDefault(require("../components/TechSidebar"));
const TechPage = () => {
    var _a;
    const [artists, setArtists] = (0, react_1.useState)([]);
    const [featuredRelease, setFeaturedRelease] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    const { colors } = (0, ThemeContext_1.useTheme)();
    (0, react_1.useEffect)(() => {
        const fetchData = () => __awaiter(void 0, void 0, void 0, function* () {
            try {
                setLoading(true);
                const [techArtists, techReleases] = yield Promise.all([
                    DatabaseService_1.databaseService.getArtistsForLabel('buildit-tech'),
                    DatabaseService_1.databaseService.getReleasesForLabel('buildit-tech')
                ]);
                if (techArtists.length === 0) {
                    setError('No artists found');
                    return;
                }
                setArtists(techArtists);
                // Set the most recent release as featured
                if (techReleases.length > 0) {
                    setFeaturedRelease(techReleases[0]);
                }
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
        return ((0, jsx_runtime_1.jsx)(PageLayout_1.default, Object.assign({ label: "tech" }, { children: (0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }, { children: (0, jsx_runtime_1.jsx)(material_1.CircularProgress, {}) })) })));
    }
    if (error) {
        return ((0, jsx_runtime_1.jsx)(PageLayout_1.default, Object.assign({ label: "tech" }, { children: (0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }, { children: (0, jsx_runtime_1.jsx)(material_1.Alert, Object.assign({ severity: "error" }, { children: error })) })) })));
    }
    return ((0, jsx_runtime_1.jsx)(PageLayout_1.default, Object.assign({ label: "tech" }, { children: (0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ sx: { display: 'flex' } }, { children: [(0, jsx_runtime_1.jsx)(TechSidebar_1.default, { variant: "permanent" }), (0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ sx: { flexGrow: 1, p: 3 } }, { children: [featuredRelease && ((0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ sx: { mb: 4 } }, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h4", component: "h1", gutterBottom: true, sx: { color: colors.text } }, { children: "Featured Release" })), (0, jsx_runtime_1.jsxs)(material_1.Card, Object.assign({ sx: {
                                        display: 'flex',
                                        backgroundColor: colors.card,
                                        borderRadius: 2
                                    } }, { children: [(0, jsx_runtime_1.jsx)(material_1.CardMedia, { component: "img", sx: { width: 300, height: 300 }, image: featuredRelease.imageUrl || 'https://via.placeholder.com/300x300?text=No+Image', alt: featuredRelease.title }), (0, jsx_runtime_1.jsxs)(material_1.CardContent, Object.assign({ sx: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' } }, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h5", component: "h2", sx: { color: colors.text } }, { children: featuredRelease.title })), (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "subtitle1", sx: { color: colors.textSecondary } }, { children: (_a = featuredRelease.primaryArtist) === null || _a === void 0 ? void 0 : _a.name })), featuredRelease.spotifyUrl && ((0, jsx_runtime_1.jsx)(material_1.IconButton, Object.assign({ component: "a", href: featuredRelease.spotifyUrl, target: "_blank", rel: "noopener noreferrer", sx: { color: colors.text, mt: 2, width: 'fit-content' } }, { children: (0, jsx_runtime_1.jsx)(icons_material_1.OpenInNew, {}) })))] }))] }))] }))), (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h4", component: "h2", gutterBottom: true, sx: { color: colors.text } }, { children: "Artists" })), (0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ container: true, spacing: 4 }, { children: artists.map((artist) => ((0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12, sm: 6, md: 4 }, { children: (0, jsx_runtime_1.jsxs)(material_1.Card, Object.assign({ sx: {
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        backgroundColor: colors.card,
                                        borderRadius: 2
                                    } }, { children: [(0, jsx_runtime_1.jsx)(material_1.CardMedia, { component: "img", sx: { height: 200, objectFit: 'cover' }, image: artist.imageUrl || 'https://via.placeholder.com/300x300?text=No+Image', alt: artist.name }), (0, jsx_runtime_1.jsxs)(material_1.CardContent, Object.assign({ sx: { flexGrow: 1 } }, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ gutterBottom: true, variant: "h5", component: "h2", sx: { color: colors.text } }, { children: artist.name })), artist.genres && artist.genres.length > 0 && ((0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "body2", sx: { mb: 2, color: colors.textSecondary } }, { children: artist.genres.join(', ') }))), artist.spotifyUrl && ((0, jsx_runtime_1.jsx)(material_1.IconButton, Object.assign({ component: "a", href: artist.spotifyUrl, target: "_blank", rel: "noopener noreferrer", sx: { color: colors.text } }, { children: (0, jsx_runtime_1.jsx)(icons_material_1.OpenInNew, {}) })))] }))] })) }), artist.id))) }))] }))] })) })));
};
exports.default = TechPage;
