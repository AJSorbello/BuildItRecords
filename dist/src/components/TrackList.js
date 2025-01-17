"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importDefault(require("react"));
const material_1 = require("@mui/material");
const icons_material_1 = require("@mui/icons-material");
const trackUtils_1 = require("../utils/trackUtils");
const TrackList = ({ tracks, loading, error, onTrackClick, }) => {
    if (loading) {
        return ((0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ display: "flex", justifyContent: "center", p: 4 }, { children: (0, jsx_runtime_1.jsx)(material_1.CircularProgress, {}) })));
    }
    if (error) {
        return ((0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ p: 4 }, { children: (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ color: "error" }, { children: error })) })));
    }
    if (!tracks.length) {
        return ((0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ p: 4 }, { children: (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ color: "text.secondary" }, { children: "No tracks found" })) })));
    }
    return ((0, jsx_runtime_1.jsx)(material_1.Paper, Object.assign({ elevation: 1 }, { children: (0, jsx_runtime_1.jsx)(material_1.List, Object.assign({ sx: { width: '100%', bgcolor: 'background.paper' } }, { children: tracks.map((track, index) => {
                var _a, _b, _c, _d;
                return ((0, jsx_runtime_1.jsxs)(material_1.ListItem, Object.assign({ button: true, onClick: () => onTrackClick === null || onTrackClick === void 0 ? void 0 : onTrackClick(track), divider: index !== tracks.length - 1 }, { children: [(0, jsx_runtime_1.jsx)(material_1.ListItemAvatar, { children: (0, jsx_runtime_1.jsx)(material_1.Avatar, { variant: "square", src: (_c = (_b = (_a = track.album) === null || _a === void 0 ? void 0 : _a.images) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.url, alt: track.name }) }), (0, jsx_runtime_1.jsx)(material_1.ListItemText, { primary: track.name, secondary: (0, jsx_runtime_1.jsxs)(react_1.default.Fragment, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ component: "span", variant: "body2", color: "text.primary" }, { children: track.artists.map(artist => artist.name).join(', ') })), ' — ', (_d = track.album) === null || _d === void 0 ? void 0 : _d.name, ' • ', (0, trackUtils_1.formatDuration)(track.duration_ms || 0)] }) }), (0, jsx_runtime_1.jsx)(material_1.ListItemSecondaryAction, { children: (0, jsx_runtime_1.jsx)(material_1.IconButton, Object.assign({ edge: "end", "aria-label": "play", onClick: (e) => {
                                    var _a;
                                    e.stopPropagation();
                                    if ((_a = track.external_urls) === null || _a === void 0 ? void 0 : _a.spotify) {
                                        window.open(track.external_urls.spotify, '_blank');
                                    }
                                } }, { children: (0, jsx_runtime_1.jsx)(icons_material_1.PlayArrow, {}) })) })] }), track.id));
            }) })) })));
};
exports.default = TrackList;
