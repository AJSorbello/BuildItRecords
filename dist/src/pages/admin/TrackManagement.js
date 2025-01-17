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
exports.TrackManagement = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const material_1 = require("@mui/material");
const ImportStatus_1 = require("../../components/ImportStatus");
const useAuth_1 = require("../../hooks/useAuth");
const config_1 = require("../../config");
const TrackManagement = () => {
    const { isAuthenticated } = (0, useAuth_1.useAuth)();
    const [tracks, setTracks] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const [selectedLabel, setSelectedLabel] = (0, react_1.useState)(config_1.LABELS[0].id);
    const [searchQuery, setSearchQuery] = (0, react_1.useState)('');
    const fetchTracks = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            setLoading(true);
            setError(null);
            // TODO: Implement API call to fetch tracks
            // const response = await getTracks(selectedLabel);
            // setTracks(response);
        }
        catch (err) {
            setError('Failed to fetch tracks');
            console.error(err);
        }
        finally {
            setLoading(false);
        }
    });
    (0, react_1.useEffect)(() => {
        if (isAuthenticated) {
            fetchTracks();
        }
    }, [isAuthenticated, selectedLabel]);
    const handleLabelChange = (event) => {
        setSelectedLabel(event.target.value);
    };
    const handleSearchChange = (event) => {
        setSearchQuery(event.target.value);
    };
    const formatDuration = (ms) => {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };
    if (!isAuthenticated) {
        return ((0, jsx_runtime_1.jsx)(material_1.Container, { children: (0, jsx_runtime_1.jsx)(material_1.Alert, Object.assign({ severity: "error" }, { children: "Please log in to access track management." })) }));
    }
    return ((0, jsx_runtime_1.jsx)(material_1.Container, Object.assign({ maxWidth: "lg" }, { children: (0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ sx: { py: 4 } }, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h4", gutterBottom: true }, { children: "Track Management" })), (0, jsx_runtime_1.jsxs)(material_1.Grid, Object.assign({ container: true, spacing: 3 }, { children: [(0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12 }, { children: (0, jsx_runtime_1.jsx)(material_1.Card, { children: (0, jsx_runtime_1.jsx)(material_1.CardContent, { children: (0, jsx_runtime_1.jsxs)(material_1.Grid, Object.assign({ container: true, spacing: 2 }, { children: [(0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12, md: 6 }, { children: (0, jsx_runtime_1.jsx)(material_1.TextField, Object.assign({ select: true, fullWidth: true, label: "Label", value: selectedLabel, onChange: handleLabelChange }, { children: config_1.LABELS.map((label) => ((0, jsx_runtime_1.jsx)(material_1.MenuItem, Object.assign({ value: label.id }, { children: label.displayName }), label.id))) })) })), (0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12, md: 6 }, { children: (0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, label: "Search Tracks", value: searchQuery, onChange: handleSearchChange, placeholder: "Search by title, artist, or release..." }) }))] })) }) }) })), (0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12 }, { children: (0, jsx_runtime_1.jsx)(ImportStatus_1.ImportStatus, { labelId: selectedLabel, onImportComplete: fetchTracks }) })), (0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12 }, { children: (0, jsx_runtime_1.jsx)(material_1.Card, { children: (0, jsx_runtime_1.jsxs)(material_1.CardContent, { children: [loading && (0, jsx_runtime_1.jsx)(material_1.LinearProgress, {}), error && (0, jsx_runtime_1.jsx)(material_1.Alert, Object.assign({ severity: "error" }, { children: error })), (0, jsx_runtime_1.jsx)(material_1.TableContainer, Object.assign({ component: material_1.Paper }, { children: (0, jsx_runtime_1.jsxs)(material_1.Table, { children: [(0, jsx_runtime_1.jsx)(material_1.TableHead, { children: (0, jsx_runtime_1.jsxs)(material_1.TableRow, { children: [(0, jsx_runtime_1.jsx)(material_1.TableCell, { children: "Title" }), (0, jsx_runtime_1.jsx)(material_1.TableCell, { children: "Release" }), (0, jsx_runtime_1.jsx)(material_1.TableCell, { children: "Artist" }), (0, jsx_runtime_1.jsx)(material_1.TableCell, { children: "Duration" })] }) }), (0, jsx_runtime_1.jsx)(material_1.TableBody, { children: tracks
                                                            .filter(track => searchQuery
                                                            ? track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                                track.artistName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                                track.releaseName.toLowerCase().includes(searchQuery.toLowerCase())
                                                            : true)
                                                            .map((track) => ((0, jsx_runtime_1.jsxs)(material_1.TableRow, Object.assign({ onClick: () => window.open(track.spotifyUrl, '_blank'), sx: {
                                                                cursor: 'pointer',
                                                                '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
                                                            } }, { children: [(0, jsx_runtime_1.jsx)(material_1.TableCell, { children: track.title }), (0, jsx_runtime_1.jsx)(material_1.TableCell, { children: track.releaseName }), (0, jsx_runtime_1.jsx)(material_1.TableCell, { children: (0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ sx: { display: 'flex', alignItems: 'center', gap: 1 } }, { children: [track.artistImage && ((0, jsx_runtime_1.jsx)(material_1.Avatar, { src: track.artistImage, alt: track.artistName, sx: { width: 30, height: 30 } })), track.artistName] })) }), (0, jsx_runtime_1.jsx)(material_1.TableCell, { children: formatDuration(track.duration) })] }), track.id))) })] }) }))] }) }) }))] }))] })) })));
};
exports.TrackManagement = TrackManagement;
