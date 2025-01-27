"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReleaseCard = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const material_1 = require("@mui/material");
const icons_material_1 = require("@mui/icons-material");
const trackUtils_1 = require("../utils/trackUtils");
const styles_1 = require("@mui/material/styles");
const ReleaseCard = ({ release, track, featured = false, ranking, onClick }) => {
    const theme = (0, styles_1.useTheme)();
    const item = release || track;
    if (!item)
        return null;
    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
        catch (error) {
            console.error('Error formatting date:', error);
            return 'Release date unavailable';
        }
    };
    // Handle both server response format and client format
    const getTitle = () => {
        return release.title || release.name || (track === null || track === void 0 ? void 0 : track.name) || 'Untitled';
    };
    const getArtists = () => {
        if (release.artists) {
            if (Array.isArray(release.artists)) {
                return release.artists.map((artist) => artist.name || artist).join(', ');
            }
            return release.artists;
        }
        if (track === null || track === void 0 ? void 0 : track.artists) {
            return Array.isArray(track.artists)
                ? track.artists.map(artist => typeof artist === 'string' ? artist : artist.name).join(', ')
                : track.artists;
        }
        return 'Unknown Artist';
    };
    const getAlbumCover = () => {
        var _a;
        if (release.artwork_url)
            return release.artwork_url;
        if (((_a = release.album) === null || _a === void 0 ? void 0 : _a.images) && release.album.images.length > 0)
            return release.album.images[0].url;
        if (release.images && release.images.length > 0)
            return release.images[0].url;
        return '';
    };
    const getSpotifyUrl = () => {
        var _a, _b;
        if (release.spotifyUrl)
            return release.spotifyUrl;
        if ((_a = release.external_urls) === null || _a === void 0 ? void 0 : _a.spotify)
            return release.external_urls.spotify;
        if ((_b = track === null || track === void 0 ? void 0 : track.external_urls) === null || _b === void 0 ? void 0 : _b.spotify)
            return track.external_urls.spotify;
        return null;
    };
    const getPreviewUrl = () => {
        return release.preview_url || (track === null || track === void 0 ? void 0 : track.preview_url) || null;
    };
    const getReleaseDate = () => {
        return release.releaseDate || release.release_date || null;
    };
    const getAlbumName = () => {
        var _a, _b;
        return ((_a = release.album) === null || _a === void 0 ? void 0 : _a.name) || release.album || ((_b = track === null || track === void 0 ? void 0 : track.album) === null || _b === void 0 ? void 0 : _b.name) || '';
    };
    const releaseDate = getReleaseDate() ? new Date(getReleaseDate()).toLocaleDateString() : 'Release date not available';
    const artistNames = getArtists();
    return ((0, jsx_runtime_1.jsxs)(material_1.Card, Object.assign({ sx: {
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            cursor: onClick ? 'pointer' : 'default',
            '&:hover': onClick ? {
                transform: 'scale(1.02)',
                transition: 'transform 0.2s ease-in-out'
            } : {}
        }, onClick: onClick }, { children: [ranking && ((0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ sx: {
                    position: 'absolute',
                    top: 10,
                    left: 10,
                    bgcolor: 'primary.main',
                    color: 'white',
                    borderRadius: '50%',
                    width: 30,
                    height: 30,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1
                } }, { children: ranking }))), (0, jsx_runtime_1.jsx)(material_1.CardMedia, { component: "img", sx: {
                    height: featured ? 400 : 200,
                    objectFit: 'cover'
                }, image: getAlbumCover(), alt: getTitle() }), (0, jsx_runtime_1.jsxs)(material_1.CardContent, Object.assign({ sx: { flexGrow: 1, position: 'relative', p: 2 } }, { children: [(0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ sx: { mb: 2 } }, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: featured ? 'h5' : 'h6', component: "h2", gutterBottom: true }, { children: getTitle() })), (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "subtitle1", color: "text.primary", sx: { fontWeight: 500, mb: 1 } }, { children: artistNames }))] })), (0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ sx: { mb: 2 } }, { children: [getReleaseDate() && ((0, jsx_runtime_1.jsxs)(material_1.Typography, Object.assign({ variant: "body2", color: "text.secondary", sx: {
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    mb: 0.5
                                } }, { children: ["Release Date: ", releaseDate] }))), (track === null || track === void 0 ? void 0 : track.duration_ms) && ((0, jsx_runtime_1.jsxs)(material_1.Typography, Object.assign({ variant: "body2", color: "text.secondary", sx: { mb: 0.5 } }, { children: ["Duration: ", (0, trackUtils_1.formatDuration)(track.duration_ms)] })))] })), (0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ sx: {
                            position: 'absolute',
                            bottom: 16,
                            right: 16,
                            display: 'flex',
                            gap: 1
                        } }, { children: [getSpotifyUrl() && ((0, jsx_runtime_1.jsx)(material_1.IconButton, Object.assign({ component: material_1.Link, href: getSpotifyUrl(), target: "_blank", rel: "noopener noreferrer", size: "small", sx: {
                                    color: theme.palette.primary.main,
                                    '&:hover': {
                                        color: theme.palette.primary.dark
                                    }
                                } }, { children: (0, jsx_runtime_1.jsx)(icons_material_1.PlayArrow, {}) }))), getPreviewUrl() && ((0, jsx_runtime_1.jsx)(material_1.Link, Object.assign({ href: getPreviewUrl(), target: "_blank", rel: "noopener noreferrer", sx: {
                                    color: 'primary.main',
                                    textDecoration: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    '&:hover': {
                                        color: 'primary.dark',
                                        textDecoration: 'underline'
                                    }
                                } }, { children: "Preview" })))] }))] }))] })));
};
exports.ReleaseCard = ReleaseCard;
exports.default = exports.ReleaseCard;
