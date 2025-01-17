"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const material_1 = require("@mui/material");
const fa_1 = require("react-icons/fa");
const theme_1 = require("../theme/theme");
const PageLayout_1 = __importDefault(require("../components/PageLayout"));
const PlaylistTrackList_1 = __importDefault(require("../components/PlaylistTrackList"));
const PlaylistCard = (0, material_1.styled)(material_1.Card)({
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    transition: 'all 0.3s ease-in-out',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    '&:hover': {
        transform: 'translateY(-8px)',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        '& .spotify-icon': {
            color: '#1DB954',
        }
    },
});
const IconLink = (0, material_1.styled)(material_1.Link)({
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    textDecoration: 'none',
    transition: 'color 0.2s ease-in-out',
    '&:hover': {
        color: '#1DB954',
    },
});
const mockPlaylists = {
    records: [
        {
            id: '1',
            title: 'House Essentials',
            description: 'The finest selection of underground house music',
            coverImage: 'https://via.placeholder.com/300x300?text=House+Essentials',
            spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DXa8NOEUWPn9W',
            followers: 5000,
            tracks: 100,
        },
        {
            id: '2',
            title: 'Deep House Vibes',
            description: 'Smooth and groovy deep house selections',
            coverImage: 'https://via.placeholder.com/300x300?text=Deep+House+Vibes',
            spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX2TRYkJECvfC',
            followers: 3500,
            tracks: 75,
        },
        {
            id: '3',
            title: 'Underground House',
            description: 'Raw and unfiltered house music from the underground',
            coverImage: 'https://via.placeholder.com/300x300?text=Underground+House',
            spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX8jqZp3XHOt3',
        },
    ],
    tech: [
        {
            id: '1',
            title: 'Techno Warehouse',
            description: 'Hard-hitting techno selections',
            coverImage: 'https://via.placeholder.com/300x300?text=Techno+Warehouse',
            spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX6J5NfMJS675',
            followers: 4200,
            tracks: 80,
        },
        {
            id: '2',
            title: 'Industrial Techno',
            description: 'Dark and industrial techno cuts',
            coverImage: 'https://via.placeholder.com/300x300?text=Industrial+Techno',
            spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX1DWK5pyjPIb',
        },
    ],
    deep: [
        {
            id: '1',
            title: 'Deep House Sessions',
            description: 'Atmospheric deep house selections',
            coverImage: 'https://via.placeholder.com/300x300?text=Deep+House+Sessions',
            spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX2TRYkJECvfC',
            followers: 3800,
            tracks: 90,
        },
        {
            id: '2',
            title: 'Melodic Deep',
            description: 'Emotional and melodic deep house',
            coverImage: 'https://via.placeholder.com/300x300?text=Melodic+Deep',
            spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX2TRYkJECvfC',
        },
    ],
};
const PlaylistPage = ({ label }) => {
    const [selectedPlaylist, setSelectedPlaylist] = (0, react_1.useState)(null);
    const playlists = mockPlaylists[label] || [];
    const labelColor = theme_1.labelColors[label];
    return ((0, jsx_runtime_1.jsx)(PageLayout_1.default, Object.assign({ label: label }, { children: (0, jsx_runtime_1.jsxs)(material_1.Container, Object.assign({ maxWidth: "lg", sx: { py: 4 } }, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h4", gutterBottom: true, sx: { color: 'text.primary', textAlign: 'center' } }, { children: label === 'tech' ? 'Build It Tech' : label === 'deep' ? 'Build It Deep' : 'Build It Records' })), (0, jsx_runtime_1.jsxs)(material_1.Typography, Object.assign({ variant: "h6", sx: { color: 'text.secondary', mb: 6, textAlign: 'center' } }, { children: [label === 'tech' ? 'Techno & Tech House' : label === 'deep' ? 'Deep House' : 'House Music', " Playlists"] })), (0, jsx_runtime_1.jsxs)(material_1.Grid, Object.assign({ container: true, spacing: 4 }, { children: [(0, jsx_runtime_1.jsxs)(material_1.Grid, Object.assign({ item: true, xs: 12, md: 4 }, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h5", gutterBottom: true, sx: { mb: 3 } }, { children: "Playlists" })), (0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ container: true, spacing: 2 }, { children: playlists.map((playlist) => {
                                        var _a;
                                        return ((0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12 }, { children: (0, jsx_runtime_1.jsxs)(PlaylistCard, Object.assign({ onClick: () => setSelectedPlaylist(playlist), sx: {
                                                    cursor: 'pointer',
                                                    border: (selectedPlaylist === null || selectedPlaylist === void 0 ? void 0 : selectedPlaylist.id) === playlist.id ? `2px solid ${labelColor}` : 'none'
                                                } }, { children: [(0, jsx_runtime_1.jsx)(material_1.CardMedia, { component: "img", sx: {
                                                            height: 0,
                                                            paddingTop: '100%',
                                                            objectFit: 'cover',
                                                            filter: 'brightness(0.9)',
                                                        }, image: playlist.coverImage, alt: playlist.title }), (0, jsx_runtime_1.jsxs)(material_1.CardContent, Object.assign({ sx: { flexGrow: 1 } }, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h6", component: "div", sx: { color: 'text.primary', mb: 1 } }, { children: playlist.title })), (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "body2", color: "text.secondary", sx: { mb: 2, minHeight: '40px' } }, { children: playlist.description })), (0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 } }, { children: [(0, jsx_runtime_1.jsxs)(material_1.Typography, Object.assign({ variant: "caption", color: "text.secondary" }, { children: [(_a = playlist.followers) === null || _a === void 0 ? void 0 : _a.toLocaleString(), " followers"] })), (0, jsx_runtime_1.jsxs)(material_1.Typography, Object.assign({ variant: "caption", color: "text.secondary" }, { children: [playlist.tracks, " tracks"] }))] })), (0, jsx_runtime_1.jsxs)(IconLink, Object.assign({ href: playlist.spotifyUrl, target: "_blank", onClick: (e) => e.stopPropagation() }, { children: [(0, jsx_runtime_1.jsx)(fa_1.FaSpotify, { size: 20, className: "spotify-icon" }), (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "body2" }, { children: "Play on Spotify" }))] }))] }))] })) }), playlist.id));
                                    }) }))] })), (0, jsx_runtime_1.jsxs)(material_1.Grid, Object.assign({ item: true, xs: 12, md: 8 }, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h5", gutterBottom: true, sx: { mb: 3 } }, { children: selectedPlaylist ? selectedPlaylist.title : 'Select a Playlist' })), selectedPlaylist ? ((0, jsx_runtime_1.jsx)(PlaylistTrackList_1.default, { playlistId: selectedPlaylist.id })) : ((0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ sx: {
                                        height: '400px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                        borderRadius: 1,
                                    } }, { children: (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "body1", color: "text.secondary" }, { children: "Select a playlist to view tracks" })) })))] }))] }))] })) })));
};
exports.default = PlaylistPage;
