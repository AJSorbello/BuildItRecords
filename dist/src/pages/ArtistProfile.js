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
const react_router_dom_1 = require("react-router-dom");
const material_1 = require("@mui/material");
const axios_1 = __importDefault(require("axios"));
const ArtistCard_1 = require("../components/ArtistCard");
const config_1 = __importDefault(require("../config"));
const ArtistProfile = () => {
    var _a;
    const { id } = (0, react_router_dom_1.useParams)();
    const [artist, setArtist] = (0, react_1.useState)(null);
    const [releases, setReleases] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    const [tabValue, setTabValue] = (0, react_1.useState)(0);
    (0, react_1.useEffect)(() => {
        const fetchArtistData = () => __awaiter(void 0, void 0, void 0, function* () {
            try {
                setLoading(true);
                // Fetch artist details
                const artistResponse = yield axios_1.default.get(`${config_1.default.API_URL}/artists/${id}`);
                setArtist(artistResponse.data);
                // Fetch releases (including collaborations)
                const releasesResponse = yield axios_1.default.get(`${config_1.default.API_URL}/artists/${id}/releases`);
                setReleases(releasesResponse.data);
                setLoading(false);
            }
            catch (err) {
                setError('Failed to load artist data');
                setLoading(false);
                console.error('Error fetching artist data:', err);
            }
        });
        if (id) {
            fetchArtistData();
        }
    }, [id]);
    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };
    if (loading) {
        return ((0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ sx: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' } }, { children: (0, jsx_runtime_1.jsx)(material_1.CircularProgress, {}) })));
    }
    if (error || !artist) {
        return ((0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ sx: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' } }, { children: (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ color: "error" }, { children: error || 'Artist not found' })) })));
    }
    const soloReleases = releases.filter(release => release.artists.length === 1);
    const collaborations = releases.filter(release => release.artists.length > 1);
    return ((0, jsx_runtime_1.jsx)(material_1.Container, Object.assign({ maxWidth: "lg", sx: { py: 4 } }, { children: (0, jsx_runtime_1.jsxs)(material_1.Grid, Object.assign({ container: true, spacing: 4 }, { children: [(0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12, md: 4 }, { children: (0, jsx_runtime_1.jsx)(ArtistCard_1.ArtistCard, { name: artist.name, imageUrl: ((_a = artist.images[0]) === null || _a === void 0 ? void 0 : _a.url) || '/default-artist-image.jpg', bio: `${artist.genres.join(', ')}\n\n${artist.followers.total.toLocaleString()} followers`, spotifyUrl: artist.external_urls.spotify, instagramUrl: artist.external_urls.instagram, soundcloudUrl: artist.external_urls.soundcloud, label: "records" }) })), (0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12, md: 8 }, { children: (0, jsx_runtime_1.jsxs)(material_1.Paper, Object.assign({ sx: { p: 3, bgcolor: 'rgba(255, 255, 255, 0.05)', borderRadius: 2 } }, { children: [(0, jsx_runtime_1.jsxs)(material_1.Tabs, Object.assign({ value: tabValue, onChange: handleTabChange, sx: {
                                    mb: 3,
                                    '& .MuiTab-root': { color: 'rgba(255, 255, 255, 0.7)' },
                                    '& .Mui-selected': { color: 'white' },
                                } }, { children: [(0, jsx_runtime_1.jsx)(material_1.Tab, { label: "Solo Releases" }), (0, jsx_runtime_1.jsx)(material_1.Tab, { label: "Collaborations" })] })), (0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ sx: { mt: 2 } }, { children: tabValue === 0 ? (soloReleases.length > 0 ? (soloReleases.map((release) => {
                                    var _a;
                                    return ((0, jsx_runtime_1.jsxs)(material_1.Paper, Object.assign({ sx: {
                                            p: 2,
                                            mb: 2,
                                            bgcolor: 'rgba(255, 255, 255, 0.02)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 2,
                                            transition: 'transform 0.2s ease-in-out',
                                            '&:hover': {
                                                transform: 'scale(1.02)',
                                                bgcolor: 'rgba(255, 255, 255, 0.04)',
                                            },
                                        } }, { children: [(0, jsx_runtime_1.jsx)("img", { src: ((_a = release.images[1]) === null || _a === void 0 ? void 0 : _a.url) || '/default-album-image.jpg', alt: release.name, style: {
                                                    width: 60,
                                                    height: 60,
                                                    objectFit: 'cover',
                                                    borderRadius: 4,
                                                } }), (0, jsx_runtime_1.jsxs)(material_1.Box, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ sx: {
                                                            color: 'white',
                                                            fontWeight: 'bold',
                                                        } }, { children: release.name })), (0, jsx_runtime_1.jsxs)(material_1.Typography, Object.assign({ variant: "body2", sx: {
                                                            color: 'rgba(255, 255, 255, 0.7)',
                                                        } }, { children: [new Date(release.release_date).getFullYear(), " \u2022 ", release.type] }))] })] }), release.id));
                                })) : ((0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ sx: { color: 'rgba(255, 255, 255, 0.7)' } }, { children: "No solo releases found" })))) : (collaborations.length > 0 ? (collaborations.map((release) => {
                                    var _a;
                                    return ((0, jsx_runtime_1.jsxs)(material_1.Paper, Object.assign({ sx: {
                                            p: 2,
                                            mb: 2,
                                            bgcolor: 'rgba(255, 255, 255, 0.02)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 2,
                                            transition: 'transform 0.2s ease-in-out',
                                            '&:hover': {
                                                transform: 'scale(1.02)',
                                                bgcolor: 'rgba(255, 255, 255, 0.04)',
                                            },
                                        } }, { children: [(0, jsx_runtime_1.jsx)("img", { src: ((_a = release.images[1]) === null || _a === void 0 ? void 0 : _a.url) || '/default-album-image.jpg', alt: release.name, style: {
                                                    width: 60,
                                                    height: 60,
                                                    objectFit: 'cover',
                                                    borderRadius: 4,
                                                } }), (0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ sx: { flex: 1 } }, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ sx: {
                                                            color: 'white',
                                                            fontWeight: 'bold',
                                                        } }, { children: release.name })), (0, jsx_runtime_1.jsxs)(material_1.Typography, Object.assign({ variant: "body2", sx: {
                                                            color: 'rgba(255, 255, 255, 0.7)',
                                                        } }, { children: ["with ", release.artists.filter(a => a.id !== id).map(a => a.name).join(', ')] })), (0, jsx_runtime_1.jsxs)(material_1.Typography, Object.assign({ variant: "body2", sx: {
                                                            color: 'rgba(255, 255, 255, 0.5)',
                                                        } }, { children: [new Date(release.release_date).getFullYear(), " \u2022 ", release.type] }))] }))] }), release.id));
                                })) : ((0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ sx: { color: 'rgba(255, 255, 255, 0.7)' } }, { children: "No collaborations found" })))) }))] })) }))] })) })));
};
exports.default = ArtistProfile;
