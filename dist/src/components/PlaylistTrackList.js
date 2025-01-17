"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const formatters_1 = require("../utils/formatters");
const material_1 = require("@mui/material");
const icons_material_1 = require("@mui/icons-material");
const TrackList = ({ tracks, currentTrack, isPlaying, onPlayTrack, onPauseTrack }) => {
    const handlePlayClick = (track) => {
        if ((currentTrack === null || currentTrack === void 0 ? void 0 : currentTrack.id) === track.id && isPlaying) {
            onPauseTrack();
        }
        else {
            onPlayTrack(track);
        }
    };
    const formatDate = (dateString) => {
        if (!dateString)
            return 'No date';
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };
    const renderTrackItem = (track) => {
        var _a;
        const isCurrentTrack = (currentTrack === null || currentTrack === void 0 ? void 0 : currentTrack.id) === track.id;
        const artistNames = ((_a = track.artists) === null || _a === void 0 ? void 0 : _a.map(artist => artist.name).join(', ')) || 'Unknown Artist';
        const release = track.release;
        return ((0, jsx_runtime_1.jsxs)(material_1.ListItem, Object.assign({ sx: {
                display: 'flex',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.05)'
                }
            } }, { children: [(0, jsx_runtime_1.jsx)(material_1.IconButton, Object.assign({ onClick: () => handlePlayClick(track), sx: { color: isCurrentTrack ? 'primary.main' : 'inherit' } }, { children: isCurrentTrack && isPlaying ? (0, jsx_runtime_1.jsx)(icons_material_1.Pause, {}) : (0, jsx_runtime_1.jsx)(icons_material_1.PlayArrow, {}) })), (0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ sx: { display: 'flex', flexDirection: 'column', flexGrow: 1, ml: 2 } }, { children: [(0, jsx_runtime_1.jsx)(material_1.Link, Object.assign({ href: track.spotify_url || '#', target: "_blank", rel: "noopener noreferrer", sx: {
                                color: 'inherit',
                                textDecoration: 'none',
                                '&:hover': {
                                    textDecoration: 'underline'
                                }
                            } }, { children: (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "subtitle1", component: "span" }, { children: track.name })) })), (0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ sx: { display: 'flex', alignItems: 'center', gap: 1 } }, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "body2", color: "text.secondary" }, { children: artistNames })), release && ((0, jsx_runtime_1.jsxs)(material_1.Typography, Object.assign({ variant: "body2", color: "text.secondary" }, { children: ["\u2022 ", release.title] })))] }))] })), (0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ sx: { display: 'flex', alignItems: 'center', gap: 2 } }, { children: [(release === null || release === void 0 ? void 0 : release.artwork_url) && ((0, jsx_runtime_1.jsx)(material_1.Box, { component: "img", src: release.artwork_url, alt: release.title, sx: {
                                width: 40,
                                height: 40,
                                objectFit: 'cover',
                                borderRadius: 1
                            } })), (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "body2", color: "text.secondary", sx: { minWidth: '100px', textAlign: 'right' } }, { children: formatDate(release === null || release === void 0 ? void 0 : release.release_date) })), (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "body2", color: "text.secondary", sx: { minWidth: '60px', textAlign: 'right' } }, { children: (0, formatters_1.formatDuration)(track.duration_ms || 0) }))] }))] }), track.id));
    };
    return ((0, jsx_runtime_1.jsx)(material_1.List, Object.assign({ sx: { width: '100%', bgcolor: 'transparent' } }, { children: tracks.map(renderTrackItem) })));
};
exports.default = TrackList;
