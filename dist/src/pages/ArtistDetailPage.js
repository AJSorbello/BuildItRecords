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
const spotify_1 = require("../services/spotify");
const PlaylistTrackList_1 = __importDefault(require("../components/PlaylistTrackList"));
const ArtistDetailPage = () => {
    var _a, _b, _c;
    const { id } = (0, react_router_dom_1.useParams)();
    const [artist, setArtist] = (0, react_1.useState)(null);
    const [tracks, setTracks] = (0, react_1.useState)([]);
    const [albums, setAlbums] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        const fetchArtistData = () => __awaiter(void 0, void 0, void 0, function* () {
            if (!id) {
                setError('Artist ID not provided');
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                setError(null);
                const [artistData, topTracks, artistAlbums] = yield Promise.all([
                    spotify_1.spotifyService.getArtist(id),
                    spotify_1.spotifyService.getArtistTopTracks(id),
                    spotify_1.spotifyService.getArtistAlbums(id)
                ]);
                if (!artistData) {
                    throw new Error('Artist not found');
                }
                setArtist(artistData);
                setTracks(topTracks);
                setAlbums(artistAlbums);
            }
            catch (err) {
                console.error('Error fetching artist:', err);
                setError(err instanceof Error ? err.message : 'Failed to load artist data');
            }
            finally {
                setLoading(false);
            }
        });
        fetchArtistData();
    }, [id]);
    if (loading) {
        return ((0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }, { children: (0, jsx_runtime_1.jsx)(material_1.CircularProgress, {}) })));
    }
    if (error || !artist) {
        return ((0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ sx: { mt: 8, textAlign: 'center' } }, { children: (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h5", color: "error" }, { children: error || 'Artist not found' })) })));
    }
    return ((0, jsx_runtime_1.jsx)(material_1.Container, Object.assign({ maxWidth: "lg", sx: { mt: 4, mb: 8 } }, { children: (0, jsx_runtime_1.jsxs)(material_1.Grid, Object.assign({ container: true, spacing: 4 }, { children: [(0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12, md: 4 }, { children: (0, jsx_runtime_1.jsxs)(material_1.Card, { children: [((_b = (_a = artist.images) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.url) && ((0, jsx_runtime_1.jsx)(material_1.CardMedia, { component: "img", image: artist.images[0].url, alt: artist.name, sx: { aspectRatio: '1/1', objectFit: 'cover' } })), (0, jsx_runtime_1.jsxs)(material_1.CardContent, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h4", component: "h1", gutterBottom: true }, { children: artist.name })), ((_c = artist.genres) === null || _c === void 0 ? void 0 : _c.length) > 0 && ((0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "body1", color: "text.secondary", gutterBottom: true }, { children: artist.genres.join(', ') }))), artist.followers && ((0, jsx_runtime_1.jsxs)(material_1.Typography, Object.assign({ variant: "body2", color: "text.secondary" }, { children: [artist.followers.total.toLocaleString(), " followers"] })))] })] }) })), (0, jsx_runtime_1.jsxs)(material_1.Grid, Object.assign({ item: true, xs: 12, md: 8 }, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h5", component: "h2", gutterBottom: true }, { children: "Top Tracks" })), (0, jsx_runtime_1.jsx)(PlaylistTrackList_1.default, { tracks: tracks }), albums.length > 0 && ((0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ sx: { mt: 4 } }, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h5", component: "h2", gutterBottom: true }, { children: "Albums" })), (0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ container: true, spacing: 2 }, { children: albums.map((album) => {
                                        var _a, _b, _c;
                                        return ((0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12, sm: 6, md: 4 }, { children: (0, jsx_runtime_1.jsxs)(material_1.Card, { children: [((_b = (_a = album.images) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.url) && ((0, jsx_runtime_1.jsx)(material_1.CardMedia, { component: "img", image: album.images[0].url, alt: album.name, sx: { aspectRatio: '1/1', objectFit: 'cover' } })), (0, jsx_runtime_1.jsxs)(material_1.CardContent, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "subtitle1", noWrap: true }, { children: album.name })), (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "body2", color: "text.secondary" }, { children: (_c = album.release_date) === null || _c === void 0 ? void 0 : _c.split('-')[0] }))] })] }) }), album.id));
                                    }) }))] })))] }))] })) })));
};
exports.default = ArtistDetailPage;
