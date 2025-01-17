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
const DatabaseService_1 = require("../../services/DatabaseService");
const labels_1 = require("../../constants/labels");
const TrackManager_1 = __importDefault(require("../../components/admin/TrackManager"));
const CloudUpload_1 = __importDefault(require("@mui/icons-material/CloudUpload"));
const SymphonicService_1 = __importDefault(require("../../services/SymphonicService"));
const Refresh_1 = __importDefault(require("@mui/icons-material/Refresh"));
const AdminDashboard = () => {
    const navigate = (0, react_router_dom_1.useNavigate)();
    const [selectedLabel, setSelectedLabel] = (0, react_1.useState)('buildit-deep');
    const [releases, setReleases] = (0, react_1.useState)([]);
    const [tracks, setTracks] = (0, react_1.useState)([]);
    const [totalReleases, setTotalReleases] = (0, react_1.useState)(0);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const [snackbar, setSnackbar] = (0, react_1.useState)({ open: false, message: '', severity: 'success' });
    (0, react_1.useEffect)(() => {
        const verifyAuth = () => __awaiter(void 0, void 0, void 0, function* () {
            const token = localStorage.getItem('adminToken');
            if (!token) {
                navigate('/admin/login');
                return;
            }
            try {
                const result = yield DatabaseService_1.databaseService.verifyAdminToken();
                if (!result.verified) {
                    console.error('Token verification failed:', result);
                    localStorage.removeItem('adminToken');
                    navigate('/admin/login');
                    return;
                }
            }
            catch (error) {
                console.error('Auth verification failed:', error);
                localStorage.removeItem('adminToken');
                navigate('/admin/login');
            }
        });
        verifyAuth();
    }, [navigate]);
    (0, react_1.useEffect)(() => {
        if (selectedLabel) {
            handleRefresh();
        }
    }, [selectedLabel]);
    const handleRefresh = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            setLoading(true);
            setError(null);
            const [releasesResponse, tracksResponse] = yield Promise.all([
                DatabaseService_1.databaseService.getReleasesByLabelId(selectedLabel),
                DatabaseService_1.databaseService.getTracks(selectedLabel)
            ]);
            // Handle releases
            if (releasesResponse && 'items' in releasesResponse) {
                setReleases(releasesResponse.items);
                setTotalReleases(releasesResponse.total);
            }
            // Handle tracks
            if (Array.isArray(tracksResponse)) {
                setTracks(tracksResponse.map(track => (Object.assign(Object.assign({}, track), { type: 'track', artists: Array.isArray(track.artists) ? track.artists : [], release: Array.isArray(track.release) ? track.release : [] }))));
            }
        }
        catch (error) {
            console.error('Error fetching data:', error);
            setError(error instanceof Error ? error.message : 'Failed to fetch data');
        }
        finally {
            setLoading(false);
        }
    });
    const handleImport = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            setLoading(true);
            setError(null);
            const importedTracks = yield DatabaseService_1.databaseService.importTracksByLabel(selectedLabel);
            // Update tracks state with imported tracks
            if (Array.isArray(importedTracks)) {
                setTracks(importedTracks.map(track => (Object.assign(Object.assign({}, track), { type: 'track', artists: Array.isArray(track.artists) ? track.artists : [], release: Array.isArray(track.release) ? track.release : [] }))));
            }
            setSnackbar({
                open: true,
                message: 'Successfully imported tracks',
                severity: 'success'
            });
        }
        catch (error) {
            console.error('Import error:', error);
            setSnackbar({
                open: true,
                message: error instanceof Error ? error.message : 'Failed to import tracks',
                severity: 'error'
            });
        }
        finally {
            setLoading(false);
        }
    });
    const handleSync = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            setLoading(true);
            setError(null);
            // Clear existing releases from localStorage
            localStorage.removeItem('releases');
            localStorage.removeItem('lastSyncTimestamp');
            // Create new SymphonicService instance and sync
            const symphonicService = new SymphonicService_1.default(process.env.REACT_APP_SYMPHONIC_API_KEY || '');
            yield symphonicService.syncReleases();
            // Refresh the dashboard
            yield handleRefresh();
            setSnackbar({
                open: true,
                message: 'Successfully synced releases',
                severity: 'success'
            });
        }
        catch (error) {
            console.error('Error syncing releases:', error);
            setError('Failed to sync releases. Please try again.');
            setSnackbar({
                open: true,
                message: 'Failed to sync releases',
                severity: 'error'
            });
        }
        finally {
            setLoading(false);
        }
    });
    return ((0, jsx_runtime_1.jsx)(material_1.Container, Object.assign({ maxWidth: "lg" }, { children: (0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ sx: { my: 4 } }, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h4", gutterBottom: true }, { children: "Admin Dashboard" })), error && (0, jsx_runtime_1.jsx)(material_1.Alert, Object.assign({ severity: "error", sx: { mb: 2 } }, { children: error })), (0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ sx: { mb: 4, display: 'flex', gap: 2 } }, { children: [(0, jsx_runtime_1.jsx)(material_1.Button, Object.assign({ variant: "contained", onClick: handleRefresh, disabled: loading, startIcon: (0, jsx_runtime_1.jsx)(Refresh_1.default, {}) }, { children: "Refresh" })), (0, jsx_runtime_1.jsx)(material_1.Button, Object.assign({ variant: "contained", onClick: handleSync, disabled: loading, startIcon: (0, jsx_runtime_1.jsx)(CloudUpload_1.default, {}), color: "secondary" }, { children: "Sync Releases" })), (0, jsx_runtime_1.jsxs)(material_1.Grid, Object.assign({ container: true, spacing: 2, alignItems: "center" }, { children: [(0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12, md: 8 }, { children: (0, jsx_runtime_1.jsxs)(material_1.FormControl, Object.assign({ fullWidth: true }, { children: [(0, jsx_runtime_1.jsx)(material_1.InputLabel, { children: "Select Label" }), (0, jsx_runtime_1.jsx)(material_1.Select, Object.assign({ value: selectedLabel, onChange: (e) => setSelectedLabel(e.target.value) }, { children: Object.entries(labels_1.RECORD_LABELS).map(([id, label]) => ((0, jsx_runtime_1.jsx)(material_1.MenuItem, Object.assign({ value: id }, { children: label.displayName }), id))) }))] })) })), (0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12, md: 4 }, { children: (0, jsx_runtime_1.jsx)(material_1.Button, Object.assign({ variant: "contained", startIcon: (0, jsx_runtime_1.jsx)(CloudUpload_1.default, {}), onClick: handleImport, disabled: loading, fullWidth: true }, { children: "Import Tracks" })) }))] }))] })), loading ? ((0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ sx: { display: 'flex', justifyContent: 'center', my: 4 } }, { children: (0, jsx_runtime_1.jsx)(material_1.CircularProgress, {}) }))) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)(material_1.Grid, Object.assign({ container: true, spacing: 3, sx: { mb: 4 } }, { children: [(0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12, md: 4 }, { children: (0, jsx_runtime_1.jsx)(material_1.Card, { children: (0, jsx_runtime_1.jsxs)(material_1.CardContent, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h6", gutterBottom: true }, { children: "Total Releases" })), (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h3" }, { children: totalReleases }))] }) }) })), (0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12, md: 4 }, { children: (0, jsx_runtime_1.jsx)(material_1.Card, { children: (0, jsx_runtime_1.jsxs)(material_1.CardContent, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h6", gutterBottom: true }, { children: "Total Tracks" })), (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h3" }, { children: tracks.length }))] }) }) })), (0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12, md: 4 }, { children: (0, jsx_runtime_1.jsx)(material_1.Card, { children: (0, jsx_runtime_1.jsxs)(material_1.CardContent, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h6", gutterBottom: true }, { children: "Total Artists" })), (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h3" }, { children: tracks ? new Set(tracks
                                                        .filter(track => track === null || track === void 0 ? void 0 : track.artists)
                                                        .flatMap(track => {
                                                        var _a;
                                                        return (_a = track.artists) === null || _a === void 0 ? void 0 : _a.filter(artist => artist && artist.id).map(artist => artist.id);
                                                    })).size : 0 }))] }) }) }))] })), (0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ sx: { mt: 4 } }, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h5", gutterBottom: true }, { children: "Track Management" })), (0, jsx_runtime_1.jsx)(TrackManager_1.default, { labelId: selectedLabel, tracks: tracks, onEdit: handleRefresh, onDelete: handleRefresh })] }))] })), (0, jsx_runtime_1.jsx)(material_1.Snackbar, { open: snackbar.open, autoHideDuration: 6000, onClose: () => setSnackbar(prev => (Object.assign(Object.assign({}, prev), { open: false }))), message: snackbar.message })] })) })));
};
exports.default = AdminDashboard;
