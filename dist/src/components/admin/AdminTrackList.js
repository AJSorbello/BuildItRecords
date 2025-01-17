"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const material_1 = require("@mui/material");
const Edit_1 = __importDefault(require("@mui/icons-material/Edit"));
const OpenInNew_1 = __importDefault(require("@mui/icons-material/OpenInNew"));
const AdminTrackList = ({ tracks, onTrackEdit, }) => {
    const formatDate = (dateString) => {
        return dateString ? new Date(dateString).toLocaleDateString() : 'N/A';
    };
    if (!tracks.length) {
        return ((0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ sx: { textAlign: 'center', py: 4 } }, { children: (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "body1", color: "text.secondary" }, { children: "No tracks available" })) })));
    }
    return ((0, jsx_runtime_1.jsx)(material_1.TableContainer, Object.assign({ component: material_1.Paper }, { children: (0, jsx_runtime_1.jsxs)(material_1.Table, { children: [(0, jsx_runtime_1.jsx)(material_1.TableHead, { children: (0, jsx_runtime_1.jsxs)(material_1.TableRow, { children: [(0, jsx_runtime_1.jsx)(material_1.TableCell, { children: "Title" }), (0, jsx_runtime_1.jsx)(material_1.TableCell, { children: "Artist" }), (0, jsx_runtime_1.jsx)(material_1.TableCell, { children: "Album" }), (0, jsx_runtime_1.jsx)(material_1.TableCell, { children: "Release Date" }), (0, jsx_runtime_1.jsx)(material_1.TableCell, { children: "Label" }), (0, jsx_runtime_1.jsx)(material_1.TableCell, Object.assign({ align: "right" }, { children: "Actions" }))] }) }), (0, jsx_runtime_1.jsx)(material_1.TableBody, { children: tracks.map((track) => {
                        var _a;
                        return ((0, jsx_runtime_1.jsxs)(material_1.TableRow, { children: [(0, jsx_runtime_1.jsx)(material_1.TableCell, { children: track.title }), (0, jsx_runtime_1.jsx)(material_1.TableCell, { children: track.artists.map((artist) => artist.name).join(', ') }), (0, jsx_runtime_1.jsx)(material_1.TableCell, { children: ((_a = track.album) === null || _a === void 0 ? void 0 : _a.name) || 'N/A' }), (0, jsx_runtime_1.jsx)(material_1.TableCell, { children: formatDate(track.releaseDate) }), (0, jsx_runtime_1.jsx)(material_1.TableCell, { children: track.label || 'N/A' }), (0, jsx_runtime_1.jsxs)(material_1.TableCell, Object.assign({ align: "right" }, { children: [(0, jsx_runtime_1.jsx)(material_1.IconButton, Object.assign({ onClick: () => onTrackEdit(track), size: "small", title: "Edit track" }, { children: (0, jsx_runtime_1.jsx)(Edit_1.default, {}) })), track.spotifyUrl && ((0, jsx_runtime_1.jsx)(material_1.IconButton, Object.assign({ href: track.spotifyUrl, target: "_blank", rel: "noopener noreferrer", size: "small", title: "Open in Spotify" }, { children: (0, jsx_runtime_1.jsx)(OpenInNew_1.default, {}) })))] }))] }, track.id));
                    }) })] }) })));
};
exports.default = AdminTrackList;
