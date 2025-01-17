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
const DatabaseService_1 = require("../services/DatabaseService");
const SpotifyService_1 = require("../services/SpotifyService");
const labels_1 = require("../constants/labels");
const spotifyUtils_1 = require("../utils/spotifyUtils");
const initialFormData = {
    id: '',
    name: '',
    artists: '',
    spotifyUrl: '',
    label: '',
    albumCover: '',
    album: {
        name: '',
        releaseDate: '',
        images: []
    },
    releaseDate: '',
    preview_url: null,
    beatportUrl: '',
    soundcloudUrl: ''
};
const initialFetchState = 'idle';
const databaseService = DatabaseService_1.DatabaseService.getInstance();
const spotifyService = SpotifyService_1.SpotifyService.getInstance();
const recordLabels = Object.values(labels_1.RECORD_LABELS);
const validateRecordLabel = (value) => {
    if (!value)
        return undefined;
    if (typeof value === 'string') {
        const label = recordLabels.find(l => l.id === value);
        return label;
    }
    return value;
};
const AdminDashboard = () => {
    const [open, setOpen] = (0, react_1.useState)(false);
    const [tracks, setTracks] = (0, react_1.useState)([]);
    const [editingId, setEditingId] = (0, react_1.useState)(null);
    const [formData, setFormData] = (0, react_1.useState)(initialFormData);
    const [fetchState, setFetchState] = (0, react_1.useState)(initialFetchState);
    const [importDialogOpen, setImportDialogOpen] = (0, react_1.useState)(false);
    const [importLabel, setImportLabel] = (0, react_1.useState)('');
    const [importing, setImporting] = (0, react_1.useState)(false);
    const [selectedLabel, setSelectedLabel] = (0, react_1.useState)('All');
    const [importProgress, setImportProgress] = (0, react_1.useState)(null);
    const [searchQuery, setSearchQuery] = (0, react_1.useState)('');
    const [currentPage, setCurrentPage] = (0, react_1.useState)(1);
    const [tracksPerPage] = (0, react_1.useState)(10);
    const [isLoggedIn, setIsLoggedIn] = (0, react_1.useState)(false);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)('');
    const [username, setUsername] = (0, react_1.useState)('');
    const [password, setPassword] = (0, react_1.useState)('');
    const processTracksEfficiently = (tracksArray) => {
        const trackMap = new Map();
        const duplicates = [];
        tracksArray.forEach(track => {
            const normalizedUrl = (0, spotifyUtils_1.normalizeSpotifyUrl)(track.spotifyUrl);
            const existingTrack = trackMap.get(normalizedUrl);
            if (existingTrack) {
                const existingDate = new Date(existingTrack.releaseDate).getTime();
                const newDate = new Date(track.releaseDate).getTime();
                if (newDate > existingDate) {
                    duplicates.push(existingTrack);
                    trackMap.set(normalizedUrl, track);
                }
                else {
                    duplicates.push(track);
                }
            }
            else {
                trackMap.set(normalizedUrl, track);
            }
        });
        const result = Array.from(trackMap.values());
        result.sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
        if (duplicates.length > 0) {
            console.log(`Found and processed ${duplicates.length} duplicate tracks:`, duplicates);
        }
        return result;
    };
    (0, react_1.useEffect)(() => {
        const loadTracks = () => {
            try {
                const storedTracks = localStorage.getItem('tracks');
                if (!storedTracks) {
                    console.log('No tracks found in localStorage, initializing empty array');
                    localStorage.setItem('tracks', JSON.stringify([]));
                    setTracks([]);
                    return;
                }
                const parsedTracks = JSON.parse(storedTracks);
                console.log('Loaded tracks from localStorage:', parsedTracks);
                const processedTracks = processTracksEfficiently(parsedTracks);
                if (processedTracks.length !== parsedTracks.length) {
                    console.log(`Processed ${parsedTracks.length - processedTracks.length} duplicate tracks`);
                    localStorage.setItem('tracks', JSON.stringify(processedTracks));
                }
                setTracks(processedTracks);
            }
            catch (error) {
                console.error('Error loading tracks:', error);
                setTracks([]);
            }
        };
        loadTracks();
    }, []);
    const cleanDuplicates = () => {
        const processedTracks = processTracksEfficiently(tracks);
        const removedCount = tracks.length - processedTracks.length;
        if (removedCount > 0) {
            setTracks(processedTracks);
            localStorage.setItem('tracks', JSON.stringify(processedTracks));
            alert(`Removed ${removedCount} duplicate tracks`);
        }
        else {
            alert('No duplicate tracks found');
        }
    };
    const handleSpotifyFetch = (trackId) => __awaiter(void 0, void 0, void 0, function* () {
        setFetchState('loading');
        try {
            const trackDetails = yield spotifyService.getTrackDetailsByUrl(formData.spotifyUrl);
            if (!trackDetails) {
                throw new Error('Failed to fetch track details from Spotify');
            }
            console.log('Fetched track details:', trackDetails);
            setFormData({
                id: trackDetails.id,
                name: trackDetails.name,
                artists: trackDetails.artists.map(artist => artist.name).join(', '),
                label: validateRecordLabel(trackDetails.label),
                spotifyUrl: trackDetails.spotifyUrl,
                albumCover: trackDetails.albumCover || '',
                album: trackDetails.album,
                releaseDate: trackDetails.releaseDate,
                preview_url: trackDetails.preview_url || null,
                beatportUrl: trackDetails.beatportUrl || '',
                soundcloudUrl: trackDetails.soundcloudUrl || ''
            });
            setFetchState('success');
        }
        catch (error) {
            console.error('Error processing Spotify URL:', error);
            setFetchState('error');
        }
    });
    const handleSpotifyUrlChange = (value) => __awaiter(void 0, void 0, void 0, function* () {
        handleInputChange('spotifyUrl', value);
        if (value && (0, spotifyUtils_1.isValidSpotifyUrl)(value)) {
            try {
                setFetchState('loading');
                const trackDetails = yield spotifyService.getTrackDetailsByUrl(value);
                if (trackDetails) {
                    setFormData({
                        id: trackDetails.id,
                        name: trackDetails.name,
                        artists: trackDetails.artists.map(artist => artist.name).join(', '),
                        label: validateRecordLabel(trackDetails.label),
                        spotifyUrl: trackDetails.spotifyUrl,
                        albumCover: trackDetails.albumCover || '',
                        album: trackDetails.album,
                        releaseDate: trackDetails.releaseDate,
                        preview_url: trackDetails.preview_url || null,
                        beatportUrl: trackDetails.beatportUrl || '',
                        soundcloudUrl: trackDetails.soundcloudUrl || ''
                    });
                    setFetchState('success');
                }
                else {
                    throw new Error('Failed to fetch track details');
                }
            }
            catch (error) {
                setFetchState('error');
            }
        }
    });
    const handleOpen = () => {
        setFormData(initialFormData);
        setEditingId(null);
        setFetchState(initialFetchState);
        setOpen(true);
    };
    const handleClose = () => {
        console.log('Closing dialog...');
        setOpen(false);
        setFormData(initialFormData);
        setEditingId(null);
        setFetchState(initialFetchState);
    };
    const handleTrackEdit = (track) => {
        setFormData({
            id: track.id,
            name: track.name,
            artists: track.artists.map(artist => artist.name).join(', '),
            spotifyUrl: track.spotifyUrl || '',
            label: track.label || labels_1.RECORD_LABELS.RECORDS,
            albumCover: track.albumCover || '',
            album: track.album || {
                name: '',
                releaseDate: '',
                images: []
            },
            releaseDate: track.releaseDate,
            preview_url: track.preview_url || null,
            beatportUrl: track.beatportUrl || '',
            soundcloudUrl: track.soundcloudUrl || ''
        });
        setEditingId(track.id);
        setOpen(true);
    };
    const handleDelete = (id) => {
        try {
            const updatedTracks = tracks.filter(track => track.id !== id);
            localStorage.setItem('tracks', JSON.stringify(updatedTracks));
            setTracks(updatedTracks);
        }
        catch (err) {
            console.error('Error deleting track:', err);
        }
    };
    const handleInputChange = (field, value) => {
        setFormData(prev => (Object.assign(Object.assign({}, prev), { [field]: value })));
        if (fetchState === 'error') {
            setFetchState(initialFetchState);
        }
    };
    const handleSelectChange = (event) => {
        const value = event.target.value;
        const recordLabel = validateRecordLabel(value);
        setFormData(prev => (Object.assign(Object.assign({}, prev), { label: recordLabel })));
    };
    const handleSubmit = (event) => __awaiter(void 0, void 0, void 0, function* () {
        event.preventDefault();
        if (!formData.releaseDate)
            return;
        const validatedLabel = validateRecordLabel(formData.label);
        if (!validatedLabel)
            return;
        const track = {
            id: formData.id,
            name: formData.name,
            artists: formData.artists.split(',').map(artist => ({
                id: crypto.randomUUID(),
                name: artist.trim(),
                external_urls: { spotify: '' },
                uri: '',
                type: 'artist'
            })),
            album: {
                id: crypto.randomUUID(),
                name: formData.album.name,
                release_date: formData.releaseDate || '',
                release_date_precision: 'day',
                images: formData.album.images,
                artists: [],
                external_urls: {},
                href: '',
                total_tracks: 1,
                type: 'album',
                uri: '',
                album_type: 'single'
            },
            duration_ms: 0,
            preview_url: formData.preview_url,
            external_urls: { spotify: formData.spotifyUrl || '' },
            external_ids: {},
            uri: '',
            type: 'track',
            explicit: false,
            disc_number: 1,
            track_number: 1,
            available_markets: [],
            recordLabel: validatedLabel,
            spotifyUrl: formData.spotifyUrl,
            releaseDate: formData.releaseDate,
            albumCover: formData.albumCover,
            beatportUrl: formData.beatportUrl,
            soundcloudUrl: formData.soundcloudUrl
        };
        try {
            yield databaseService.createTrack(track);
            setFormData(initialFormData);
        }
        catch (error) {
            console.error('Error creating track:', error);
        }
    });
    const handleTrackSubmit = (formData) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            setFetchState('loading');
            const newTrack = {
                id: editingId || crypto.randomUUID(),
                name: formData.name,
                artists: formData.artists.split(',').map(name => ({
                    id: crypto.randomUUID(),
                    name: name.trim(),
                    external_urls: {},
                    uri: '',
                    type: 'artist',
                    spotify_url: ''
                })),
                spotifyUrl: formData.spotifyUrl,
                label: formData.label,
                albumCover: formData.albumCover,
                album: formData.album,
                releaseDate: formData.releaseDate || new Date().toISOString(),
                preview_url: formData.preview_url,
                beatportUrl: formData.beatportUrl,
                soundcloudUrl: formData.soundcloudUrl
            };
            const existingTracks = JSON.parse(localStorage.getItem('tracks') || '[]');
            const updatedTracks = editingId
                ? existingTracks.map(track => track.id === editingId ? newTrack : track)
                : [...existingTracks, newTrack];
            localStorage.setItem('tracks', JSON.stringify(updatedTracks));
            setTracks(updatedTracks);
            setFormData(initialFormData);
            setFetchState('success');
            handleClose();
        }
        catch (err) {
            console.error('Error submitting track:', err);
            setFetchState('error');
        }
    });
    const handleImportDialogOpen = () => {
        setImportDialogOpen(true);
        setImportLabel('');
    };
    const handleImportDialogClose = () => {
        setImportDialogOpen(false);
        setImportLabel('');
    };
    const handleImportTracks = () => __awaiter(void 0, void 0, void 0, function* () {
        if (!importLabel) {
            setFetchState('error');
            return;
        }
        const validLabels = ['build it deep', 'build it records', 'build it tech'];
        if (!validLabels.includes(importLabel.toLowerCase())) {
            setFetchState('error');
            return;
        }
        setImporting(true);
        setImportProgress(null);
        setFetchState('loading');
        try {
            const initialTrackCount = tracks.length;
            const importedTracks = yield spotifyService.importLabelTracks(importLabel, 50, (imported, total) => {
                setImportProgress({ total, current: imported, status: 'importing' });
            });
            const updatedTracks = [...tracks];
            for (const track of importedTracks) {
                if (!updatedTracks.some(t => t.id === track.id)) {
                    updatedTracks.push(track);
                }
            }
            updatedTracks.sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
            setTracks(updatedTracks);
            localStorage.setItem('tracks', JSON.stringify(updatedTracks));
            const newTracksCount = importedTracks.length;
            alert(`Successfully imported ${newTracksCount} new tracks from ${importLabel}`);
            setImportDialogOpen(false);
            setImportLabel('');
            setImportProgress(null);
            setFetchState('success');
            setImporting(false);
        }
        catch (error) {
            console.error('Error importing tracks:', error);
            setFetchState('error');
        }
        finally {
            setImporting(false);
        }
    });
    const handleLabelChange = (event) => {
        setSelectedLabel(event.target.value);
    };
    const handlePageChange = (event, value) => {
        setCurrentPage(value);
    };
    const handleLogin = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            setLoading(true);
            const response = yield databaseService.adminLogin(username, password);
            console.log('Login successful:', response);
            const verified = yield databaseService.verifyAdminToken();
            if (verified.verified) {
                setIsLoggedIn(true);
                setError('');
            }
            else {
                setError('Login verification failed');
                setIsLoggedIn(false);
            }
        }
        catch (error) {
            console.error('Login error:', error);
            setError(error instanceof Error ? error.message : 'Login failed');
            setIsLoggedIn(false);
        }
        finally {
            setLoading(false);
        }
    });
    const handleImport = (labelId) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            setLoading(true);
            const verified = yield databaseService.verifyAdminToken();
            if (!verified.verified) {
                setError('Admin session expired. Please log in again.');
                setIsLoggedIn(false);
                return;
            }
            const result = yield databaseService.importTracksByLabel(labelId);
            console.log('Import successful:', result);
            setError('');
        }
        catch (error) {
            console.error('Import error:', error);
            setError(error instanceof Error ? error.message : 'Import failed');
            if (error instanceof Error && error.message.includes('Admin token not found')) {
                setIsLoggedIn(false);
            }
        }
        finally {
            setLoading(false);
        }
    });
    const filteredTracks = tracks.filter(track => {
        var _a, _b;
        const matchesSearch = searchQuery.toLowerCase() === '' ||
            track.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            track.artists.some(artist => artist.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (((_a = track.spotifyUrl) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(searchQuery.toLowerCase())) || false);
        const matchesLabel = selectedLabel === 'All' || ((_b = track.label) === null || _b === void 0 ? void 0 : _b.name) === selectedLabel;
        return matchesSearch && matchesLabel;
    });
    const indexOfLastTrack = currentPage * tracksPerPage;
    const indexOfFirstTrack = indexOfLastTrack - tracksPerPage;
    const currentTracks = filteredTracks.slice(indexOfFirstTrack, indexOfLastTrack);
    const totalPages = Math.ceil(filteredTracks.length / tracksPerPage);
    return ((0, jsx_runtime_1.jsxs)(material_1.Container, Object.assign({ sx: { py: 4 } }, { children: [(0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ sx: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 4,
                    backgroundColor: '#282828',
                    p: 3,
                    borderRadius: 2
                } }, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h4", component: "h1", sx: { color: '#FFFFFF' } }, { children: "Track Management" })), (0, jsx_runtime_1.jsxs)(material_1.Box, { children: [(0, jsx_runtime_1.jsx)(material_1.Button, Object.assign({ variant: "contained", onClick: handleImportDialogOpen, sx: { mr: 2 } }, { children: "Import by Label" })), (0, jsx_runtime_1.jsx)(material_1.Button, Object.assign({ variant: "contained", onClick: handleOpen, sx: {
                                    backgroundColor: '#02FF95',
                                    color: '#121212',
                                    '&:hover': {
                                        backgroundColor: '#00CC76',
                                    }
                                } }, { children: "Add New Track" }))] })] })), fetchState === 'error' && ((0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ color: "error", sx: { mb: 2 } }, { children: "Error:" }))), (0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ sx: { mb: 4, display: 'flex', gap: 2, alignItems: 'center' } }, { children: [(0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, label: "Search tracks", variant: "outlined", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), placeholder: "Search by title, artist, or Spotify URL", sx: { flex: 1 } }), (0, jsx_runtime_1.jsxs)(material_1.FormControl, Object.assign({ sx: { minWidth: 200 } }, { children: [(0, jsx_runtime_1.jsx)(material_1.InputLabel, { children: "Filter by Label" }), (0, jsx_runtime_1.jsxs)(material_1.Select, Object.assign({ value: selectedLabel, onChange: (e) => setSelectedLabel(e.target.value), label: "Filter by Label" }, { children: [(0, jsx_runtime_1.jsx)(material_1.MenuItem, Object.assign({ value: "All" }, { children: "All Labels" })), Object.values(labels_1.RECORD_LABELS).map((label) => ((0, jsx_runtime_1.jsx)(material_1.MenuItem, Object.assign({ value: label }, { children: label }), label)))] }))] })), (0, jsx_runtime_1.jsx)(material_1.Button, Object.assign({ variant: "contained", color: "primary", onClick: () => {
                            setFormData(initialFormData);
                            setOpen(true);
                        } }, { children: "Add Track" })), (0, jsx_runtime_1.jsx)(material_1.Button, Object.assign({ variant: "outlined", color: "secondary", onClick: cleanDuplicates, title: "Remove duplicate tracks based on Spotify URL" }, { children: "Clean Duplicates" }))] })), (0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ sx: {
                    display: 'flex',
                    justifyContent: 'center',
                    mb: 2
                } }, { children: (0, jsx_runtime_1.jsxs)(material_1.Stack, Object.assign({ spacing: 2, direction: "row", alignItems: "center" }, { children: [(0, jsx_runtime_1.jsxs)(material_1.Typography, Object.assign({ variant: "body2", color: "text.secondary" }, { children: ["Page ", currentPage, " of ", totalPages, " \u2022 ", filteredTracks.length, " Releases"] })), (0, jsx_runtime_1.jsx)(material_1.Pagination, { count: totalPages, page: currentPage, onChange: handlePageChange, color: "primary", size: "large", showFirstButton: true, showLastButton: true })] })) })), (0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ sx: {
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    maxHeight: '600px',
                    overflowY: 'auto',
                    p: 2,
                    border: '1px solid #e0e0e0',
                    borderRadius: 1,
                    bgcolor: '#f5f5f5'
                } }, { children: currentTracks.length === 0 ? ((0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "body1", sx: { textAlign: 'center', py: 4, color: 'text.secondary' } }, { children: searchQuery || selectedLabel !== 'All'
                        ? 'No tracks found matching your search criteria'
                        : 'No tracks added yet' }))) : (currentTracks.map((track) => {
                    var _a;
                    return ((0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ component: "li", sx: { display: 'flex', alignItems: 'center', mb: 2, backgroundColor: '#333', p: 2, borderRadius: 1 } }, { children: [(0, jsx_runtime_1.jsx)(material_1.Box, { component: "img", src: track.albumCover, alt: track.name, sx: { width: 50, height: 50, mr: 2, borderRadius: 1 } }), (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "body1", sx: { color: '#FFFFFF', flex: 1 } }, { children: track.name })), (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "body2", sx: { color: '#AAAAAA', flex: 1 } }, { children: track.artists.map(artist => artist.name).join(', ') })), (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "body2", sx: { color: '#AAAAAA', flex: 1 } }, { children: ((_a = track.label) === null || _a === void 0 ? void 0 : _a.name) || 'N/A' })), (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "body2", sx: { color: '#AAAAAA', flex: 1 } }, { children: track.releaseDate ? new Date(track.releaseDate).toLocaleDateString() : 'Unknown' }))] }), track.id));
                })) })), (0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ sx: {
                    display: 'flex',
                    justifyContent: 'center',
                    mt: 2
                } }, { children: (0, jsx_runtime_1.jsxs)(material_1.Stack, Object.assign({ spacing: 2, direction: "row", alignItems: "center" }, { children: [(0, jsx_runtime_1.jsxs)(material_1.Typography, Object.assign({ variant: "body2", color: "text.secondary" }, { children: ["Page ", currentPage, " of ", totalPages, " \u2022 ", filteredTracks.length, " Releases"] })), (0, jsx_runtime_1.jsx)(material_1.Pagination, { count: totalPages, page: currentPage, onChange: handlePageChange, color: "primary", size: "large", showFirstButton: true, showLastButton: true })] })) })), (0, jsx_runtime_1.jsxs)(material_1.Dialog, Object.assign({ open: open, onClose: handleClose, maxWidth: "md", fullWidth: true, PaperProps: {
                    sx: {
                        bgcolor: 'rgba(18, 18, 18, 0.95)',
                        color: '#fff',
                        backdropFilter: 'blur(10px)',
                        borderRadius: 2
                    }
                } }, { children: [(0, jsx_runtime_1.jsx)(material_1.DialogTitle, Object.assign({ sx: { color: '#fff' } }, { children: editingId ? 'Edit Track' : 'Add New Track' })), (0, jsx_runtime_1.jsx)(material_1.DialogContent, { children: (0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ sx: { mt: 2 } }, { children: [(0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, label: "Spotify URL", value: formData.spotifyUrl, onChange: (e) => handleSpotifyUrlChange(e.target.value), error: fetchState === 'error', helperText: fetchState === 'error' ? 'Error' : '', sx: {
                                        mb: 2,
                                        '& .MuiOutlinedInput-root': {
                                            color: '#fff',
                                            '& fieldset': {
                                                borderColor: 'rgba(255, 255, 255, 0.23)',
                                            },
                                            '&:hover fieldset': {
                                                borderColor: 'rgba(255, 255, 255, 0.5)',
                                            },
                                        },
                                        '& .MuiInputLabel-root': {
                                            color: 'rgba(255, 255, 255, 0.7)',
                                        },
                                    } }), (0, jsx_runtime_1.jsxs)(material_1.FormControl, Object.assign({ fullWidth: true, sx: { mb: 2 } }, { children: [(0, jsx_runtime_1.jsx)(material_1.InputLabel, Object.assign({ id: "record-label-select-label", sx: { color: 'rgba(255, 255, 255, 0.7)' } }, { children: "Record Label" })), (0, jsx_runtime_1.jsx)(material_1.Select, Object.assign({ labelId: "record-label-select-label", value: formData.label, onChange: handleSelectChange, label: "Record Label", sx: {
                                                color: '#fff',
                                                '& .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: 'rgba(255, 255, 255, 0.23)',
                                                },
                                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: 'rgba(255, 255, 255, 0.5)',
                                                },
                                            } }, { children: Object.values(labels_1.RECORD_LABELS).map((label) => ((0, jsx_runtime_1.jsx)(material_1.MenuItem, Object.assign({ value: label }, { children: label }), label))) }))] })), formData.albumCover && ((0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ sx: {
                                        width: '100%',
                                        position: 'relative',
                                        paddingTop: '100%',
                                        mb: 2,
                                        borderRadius: 2,
                                        overflow: 'hidden'
                                    } }, { children: (0, jsx_runtime_1.jsx)(material_1.Box, { component: "img", src: formData.albumCover, alt: formData.name, sx: {
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover'
                                        } }) }))), (0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, label: "Track Title", value: formData.name, onChange: (e) => handleInputChange('name', e.target.value), sx: {
                                        mb: 2,
                                        '& .MuiOutlinedInput-root': {
                                            color: '#fff',
                                            '& fieldset': {
                                                borderColor: 'rgba(255, 255, 255, 0.23)',
                                            },
                                            '&:hover fieldset': {
                                                borderColor: 'rgba(255, 255, 255, 0.5)',
                                            },
                                        },
                                        '& .MuiInputLabel-root': {
                                            color: 'rgba(255, 255, 255, 0.7)',
                                        },
                                    } }), (0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, label: "Artists", value: formData.artists, onChange: (e) => handleInputChange('artists', e.target.value), sx: {
                                        mb: 2,
                                        '& .MuiOutlinedInput-root': {
                                            color: '#fff',
                                            '& fieldset': {
                                                borderColor: 'rgba(255, 255, 255, 0.23)',
                                            },
                                            '&:hover fieldset': {
                                                borderColor: 'rgba(255, 255, 255, 0.5)',
                                            },
                                        },
                                        '& .MuiInputLabel-root': {
                                            color: 'rgba(255, 255, 255, 0.7)',
                                        },
                                    } }), (0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, label: "Beatport URL (Optional)", value: formData.beatportUrl, onChange: (e) => handleInputChange('beatportUrl', e.target.value), sx: {
                                        mb: 2,
                                        '& .MuiOutlinedInput-root': {
                                            color: '#fff',
                                            '& fieldset': {
                                                borderColor: 'rgba(255, 255, 255, 0.23)',
                                            },
                                            '&:hover fieldset': {
                                                borderColor: 'rgba(255, 255, 255, 0.5)',
                                            },
                                        },
                                        '& .MuiInputLabel-root': {
                                            color: 'rgba(255, 255, 255, 0.7)',
                                        },
                                    } }), (0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, label: "SoundCloud URL (Optional)", value: formData.soundcloudUrl, onChange: (e) => handleInputChange('soundcloudUrl', e.target.value), sx: {
                                        '& .MuiOutlinedInput-root': {
                                            color: '#fff',
                                            '& fieldset': {
                                                borderColor: 'rgba(255, 255, 255, 0.23)',
                                            },
                                            '&:hover fieldset': {
                                                borderColor: 'rgba(255, 255, 255, 0.5)',
                                            },
                                        },
                                        '& .MuiInputLabel-root': {
                                            color: 'rgba(255, 255, 255, 0.7)',
                                        },
                                    } })] })) }), (0, jsx_runtime_1.jsxs)(material_1.DialogActions, Object.assign({ sx: { p: 3 } }, { children: [(0, jsx_runtime_1.jsx)(material_1.Button, Object.assign({ onClick: handleClose, sx: {
                                    color: '#fff',
                                    '&:hover': {
                                        bgcolor: 'rgba(255, 255, 255, 0.1)'
                                    }
                                } }, { children: "Cancel" })), (0, jsx_runtime_1.jsx)(material_1.Button, Object.assign({ onClick: handleSubmit, variant: "contained", disabled: fetchState === 'loading', sx: {
                                    bgcolor: '#1DB954',
                                    color: '#fff',
                                    '&:hover': {
                                        bgcolor: '#1ed760'
                                    }
                                } }, { children: fetchState === 'loading' ? ((0, jsx_runtime_1.jsx)(material_1.CircularProgress, { size: 24, sx: { color: '#fff' } })) : (editingId ? 'Save Changes' : 'Add Track') }))] }))] })), (0, jsx_runtime_1.jsxs)(material_1.Dialog, Object.assign({ open: importDialogOpen, onClose: () => !importing && setImportDialogOpen(false) }, { children: [(0, jsx_runtime_1.jsx)(material_1.DialogTitle, { children: "Import Tracks by Label" }), (0, jsx_runtime_1.jsx)(material_1.DialogContent, { children: (0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ sx: { width: '100%', mt: 2 } }, { children: [(0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, label: "Label Name", value: importLabel, onChange: (e) => setImportLabel(e.target.value), disabled: importing, helperText: "Enter exact label name: 'Build It Deep', 'Build It Records', or 'Build It Tech'", error: fetchState === 'error' }), fetchState === 'error' && ((0, jsx_runtime_1.jsx)(material_1.Typography, { color: "error", sx: { mt: 1 } })), importing && importProgress && ((0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ sx: { mt: 2, textAlign: 'center' } }, { children: [(0, jsx_runtime_1.jsx)(material_1.CircularProgress, { size: 24, sx: { mb: 1 } }), (0, jsx_runtime_1.jsxs)(material_1.Typography, Object.assign({ variant: "body2" }, { children: ["Importing tracks: ", importProgress.current, " of ", importProgress.total, importProgress.current < importProgress.total && '... (waiting 3s between batches)'] }))] })))] })) }), (0, jsx_runtime_1.jsxs)(material_1.DialogActions, { children: [(0, jsx_runtime_1.jsx)(material_1.Button, Object.assign({ onClick: () => setImportDialogOpen(false), disabled: importing }, { children: "Cancel" })), (0, jsx_runtime_1.jsx)(material_1.Button, Object.assign({ onClick: handleImportTracks, variant: "contained", color: "primary", disabled: importing || !importLabel }, { children: importing ? 'Importing...' : 'Import' }))] })] })), (0, jsx_runtime_1.jsxs)(material_1.Dialog, Object.assign({ open: !isLoggedIn, onClose: () => !loading && setIsLoggedIn(false) }, { children: [(0, jsx_runtime_1.jsx)(material_1.DialogTitle, { children: "Login" }), (0, jsx_runtime_1.jsx)(material_1.DialogContent, { children: (0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ sx: { width: '100%', mt: 2 } }, { children: [(0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, label: "Username", value: username, onChange: (e) => setUsername(e.target.value), disabled: loading }), (0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, label: "Password", type: "password", value: password, onChange: (e) => setPassword(e.target.value), disabled: loading, sx: { mt: 2 } }), error && ((0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ color: "error", sx: { mt: 1 } }, { children: error })))] })) }), (0, jsx_runtime_1.jsxs)(material_1.DialogActions, { children: [(0, jsx_runtime_1.jsx)(material_1.Button, Object.assign({ onClick: () => setIsLoggedIn(false), disabled: loading }, { children: "Cancel" })), (0, jsx_runtime_1.jsx)(material_1.Button, Object.assign({ onClick: handleLogin, variant: "contained", color: "primary", disabled: loading || !username || !password }, { children: loading ? 'Logging in...' : 'Login' }))] })] }))] })));
};
exports.default = AdminDashboard;
