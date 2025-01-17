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
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const material_1 = require("@mui/material");
const icons_material_1 = require("@mui/icons-material");
const spotifyUtils_1 = require("../utils/spotifyUtils");
const AdminTrackList = ({ tracks, onDeleteTrack, onEditTrack }) => {
    const [trackDetails, setTrackDetails] = (0, react_1.useState)({});
    const [loading, setLoading] = (0, react_1.useState)({});
    const [deleteDialogOpen, setDeleteDialogOpen] = (0, react_1.useState)(false);
    const [trackToDelete, setTrackToDelete] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        const fetchAllTrackDetails = () => __awaiter(void 0, void 0, void 0, function* () {
            for (const track of tracks) {
                if (!trackDetails[track.id] && !loading[track.id]) {
                    setLoading(prev => (Object.assign(Object.assign({}, prev), { [track.id]: true })));
                    try {
                        const details = yield (0, spotifyUtils_1.fetchTrackDetails)(track.spotifyUrl);
                        setTrackDetails(prev => (Object.assign(Object.assign({}, prev), { [track.id]: details })));
                    }
                    catch (error) {
                        console.error(`Error fetching details for track ${track.id}:`, error);
                    }
                    finally {
                        setLoading(prev => (Object.assign(Object.assign({}, prev), { [track.id]: false })));
                    }
                }
            }
        });
        fetchAllTrackDetails();
    }, [tracks]);
    const handleDeleteClick = (trackId) => {
        setTrackToDelete(trackId);
        setDeleteDialogOpen(true);
    };
    const handleConfirmDelete = () => {
        if (trackToDelete) {
            onDeleteTrack === null || onDeleteTrack === void 0 ? void 0 : onDeleteTrack(trackToDelete);
            setDeleteDialogOpen(false);
            setTrackToDelete(null);
        }
    };
    const handleCancelDelete = () => {
        setDeleteDialogOpen(false);
        setTrackToDelete(null);
    };
    if (!tracks || tracks.length === 0) {
        return ((0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ sx: { width: '100%', textAlign: 'center', py: 4 } }, { children: (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "body1", sx: { color: '#AAAAAA' } }, { children: "No tracks available" })) })));
    }
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(material_1.List, { children: tracks.map((track) => ((0, jsx_runtime_1.jsxs)(material_1.ListItem, Object.assign({ sx: {
                        display: 'flex',
                        alignItems: 'center',
                        borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
                        '&:last-child': {
                            borderBottom: 'none',
                        },
                    } }, { children: [(0, jsx_runtime_1.jsx)(material_1.Box, { component: "img", src: track.albumCover || '/placeholder-album.jpg', alt: `${track.trackTitle} album cover`, sx: {
                                width: 60,
                                height: 60,
                                objectFit: 'cover',
                                marginRight: 2,
                                borderRadius: 1
                            } }), (0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ sx: { flexGrow: 1 } }, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "subtitle1", component: "div" }, { children: track.trackTitle })), (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "body2", color: "text.secondary" }, { children: track.artist }))] })), (0, jsx_runtime_1.jsxs)(material_1.Box, { children: [onEditTrack && ((0, jsx_runtime_1.jsx)(material_1.IconButton, Object.assign({ onClick: () => onEditTrack(track), size: "small", sx: { marginRight: 1 } }, { children: (0, jsx_runtime_1.jsx)(icons_material_1.Edit, {}) }))), onDeleteTrack && ((0, jsx_runtime_1.jsx)(material_1.IconButton, Object.assign({ onClick: () => handleDeleteClick(track.id), size: "small", color: "error" }, { children: (0, jsx_runtime_1.jsx)(icons_material_1.Delete, {}) })))] })] }), track.id))) }), (0, jsx_runtime_1.jsxs)(material_1.Dialog, Object.assign({ open: deleteDialogOpen, onClose: handleCancelDelete }, { children: [(0, jsx_runtime_1.jsx)(material_1.DialogTitle, { children: "Confirm Delete" }), (0, jsx_runtime_1.jsx)(material_1.DialogContent, { children: "Are you sure you want to delete this track?" }), (0, jsx_runtime_1.jsxs)(material_1.DialogActions, { children: [(0, jsx_runtime_1.jsx)(material_1.Button, Object.assign({ onClick: handleCancelDelete }, { children: "Cancel" })), (0, jsx_runtime_1.jsx)(material_1.Button, Object.assign({ onClick: handleConfirmDelete, color: "error" }, { children: "Delete" }))] })] }))] }));
};
exports.default = AdminTrackList;
