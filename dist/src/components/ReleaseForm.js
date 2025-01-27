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
exports.ReleaseForm = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const material_1 = require("@mui/material");
const DatePicker_1 = require("@mui/x-date-pickers/DatePicker");
const LocalizationProvider_1 = require("@mui/x-date-pickers/LocalizationProvider");
const AdapterDateFns_1 = require("@mui/x-date-pickers/AdapterDateFns");
const useFormSubmission_1 = require("../hooks/useFormSubmission");
const spotifyUtils_1 = require("../utils/spotifyUtils");
const spotifyUtils_2 = require("../utils/spotifyUtils");
const ReleaseForm = ({ label }) => {
    const [releaseDate, setReleaseDate] = (0, react_1.useState)(null);
    const { handleSubmit, isSubmitting, submitError } = (0, useFormSubmission_1.useFormSubmission)();
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const [formData, setFormData] = (0, react_1.useState)({
        title: '',
        artist: '',
        imageUrl: '',
        releaseDate: new Date().toISOString(),
        spotifyUrl: '',
        beatportUrl: '',
        soundcloudUrl: '',
        label,
        genre: '',
    });
    const handleInputChange = (e) => __awaiter(void 0, void 0, void 0, function* () {
        const { name, value } = e.target;
        setFormData((prev) => (Object.assign(Object.assign({}, prev), { [name]: value })));
        // Auto-fill form when Spotify URL is entered
        if (name === 'spotifyUrl' && value) {
            try {
                if (!(0, spotifyUtils_2.isValidSpotifyUrl)(value)) {
                    setError('Please enter a valid Spotify track URL (e.g., https://open.spotify.com/track/...)');
                    return;
                }
                setLoading(true);
                setError(null);
                const trackDetails = yield (0, spotifyUtils_1.fetchTrackDetails)(value);
                setFormData(prev => (Object.assign(Object.assign({}, prev), { title: trackDetails.trackTitle, artist: trackDetails.artist, imageUrl: trackDetails.albumCover || '', releaseDate: trackDetails.releaseDate })));
                setReleaseDate(trackDetails.releaseDate ? new Date(trackDetails.releaseDate) : null);
            }
            catch (err) {
                console.error('Error fetching track details:', err);
                setError('Failed to fetch track details from Spotify. Please check the URL and try again.');
            }
            finally {
                setLoading(false);
            }
        }
    });
    const handleSelectChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => (Object.assign(Object.assign({}, prev), { [name]: value })));
    };
    const handleDateChange = (date) => {
        setReleaseDate(date);
        if (date) {
            setFormData((prev) => (Object.assign(Object.assign({}, prev), { releaseDate: date.toISOString() })));
        }
    };
    const onSubmit = (e) => __awaiter(void 0, void 0, void 0, function* () {
        e.preventDefault();
        yield handleSubmit(formData);
    });
    return ((0, jsx_runtime_1.jsxs)(material_1.Paper, Object.assign({ elevation: 3, sx: { p: 4, backgroundColor: 'rgba(255, 255, 255, 0.05)' } }, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h5", component: "h2", gutterBottom: true, sx: { color: '#FFFFFF' } }, { children: "Submit a Release" })), error && ((0, jsx_runtime_1.jsx)(material_1.Alert, Object.assign({ severity: "error", sx: { mb: 2 } }, { children: error }))), (0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ component: "form", onSubmit: onSubmit, sx: { display: 'flex', flexDirection: 'column', gap: 3 } }, { children: [(0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, label: "Spotify URL", name: "spotifyUrl", value: formData.spotifyUrl, onChange: handleInputChange, disabled: loading, sx: {
                            '& .MuiInputLabel-root': { color: '#AAAAAA' },
                            '& .MuiOutlinedInput-root': {
                                '& fieldset': { borderColor: '#AAAAAA' },
                                '&:hover fieldset': { borderColor: '#FFFFFF' },
                                '&.Mui-focused fieldset': { borderColor: '#02FF95' }
                            },
                            '& input': { color: '#FFFFFF' }
                        } }), loading && ((0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ sx: { display: 'flex', justifyContent: 'center', my: 2 } }, { children: (0, jsx_runtime_1.jsx)(material_1.CircularProgress, { size: 24 }) }))), (0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, required: true, label: "Title", name: "title", value: formData.title, onChange: handleInputChange, disabled: loading, sx: {
                            '& .MuiInputLabel-root': { color: '#AAAAAA' },
                            '& .MuiOutlinedInput-root': {
                                '& fieldset': { borderColor: '#AAAAAA' },
                                '&:hover fieldset': { borderColor: '#FFFFFF' },
                                '&.Mui-focused fieldset': { borderColor: '#02FF95' }
                            },
                            '& input': { color: '#FFFFFF' }
                        } }), (0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, required: true, label: "Artist", name: "artist", value: formData.artist, onChange: handleInputChange, disabled: loading, sx: {
                            '& .MuiInputLabel-root': { color: '#AAAAAA' },
                            '& .MuiOutlinedInput-root': {
                                '& fieldset': { borderColor: '#AAAAAA' },
                                '&:hover fieldset': { borderColor: '#FFFFFF' },
                                '&.Mui-focused fieldset': { borderColor: '#02FF95' }
                            },
                            '& input': { color: '#FFFFFF' }
                        } }), (0, jsx_runtime_1.jsx)(LocalizationProvider_1.LocalizationProvider, Object.assign({ dateAdapter: AdapterDateFns_1.AdapterDateFns }, { children: (0, jsx_runtime_1.jsx)(DatePicker_1.DatePicker, { label: "Release Date", value: releaseDate, onChange: handleDateChange, disabled: loading, sx: {
                                '& .MuiInputLabel-root': { color: '#AAAAAA' },
                                '& .MuiOutlinedInput-root': {
                                    '& fieldset': { borderColor: '#AAAAAA' },
                                    '&:hover fieldset': { borderColor: '#FFFFFF' },
                                    '&.Mui-focused fieldset': { borderColor: '#02FF95' }
                                },
                                '& input': { color: '#FFFFFF' }
                            } }) })), (0, jsx_runtime_1.jsxs)(material_1.FormControl, Object.assign({ fullWidth: true }, { children: [(0, jsx_runtime_1.jsx)(material_1.InputLabel, Object.assign({ sx: { color: '#AAAAAA' } }, { children: "Genre" })), (0, jsx_runtime_1.jsxs)(material_1.Select, Object.assign({ name: "genre", value: formData.genre, onChange: handleSelectChange, disabled: loading, sx: {
                                    color: '#FFFFFF',
                                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#AAAAAA' },
                                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#FFFFFF' },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#02FF95' }
                                } }, { children: [(0, jsx_runtime_1.jsx)(material_1.MenuItem, Object.assign({ value: "house" }, { children: "House" })), (0, jsx_runtime_1.jsx)(material_1.MenuItem, Object.assign({ value: "techno" }, { children: "Techno" })), (0, jsx_runtime_1.jsx)(material_1.MenuItem, Object.assign({ value: "deep-house" }, { children: "Deep House" })), (0, jsx_runtime_1.jsx)(material_1.MenuItem, Object.assign({ value: "tech-house" }, { children: "Tech House" }))] }))] })), (0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, label: "Beatport URL", name: "beatportUrl", value: formData.beatportUrl, onChange: handleInputChange, disabled: loading, sx: {
                            '& .MuiInputLabel-root': { color: '#AAAAAA' },
                            '& .MuiOutlinedInput-root': {
                                '& fieldset': { borderColor: '#AAAAAA' },
                                '&:hover fieldset': { borderColor: '#FFFFFF' },
                                '&.Mui-focused fieldset': { borderColor: '#02FF95' }
                            },
                            '& input': { color: '#FFFFFF' }
                        } }), (0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, label: "SoundCloud URL", name: "soundcloudUrl", value: formData.soundcloudUrl, onChange: handleInputChange, disabled: loading, sx: {
                            '& .MuiInputLabel-root': { color: '#AAAAAA' },
                            '& .MuiOutlinedInput-root': {
                                '& fieldset': { borderColor: '#AAAAAA' },
                                '&:hover fieldset': { borderColor: '#FFFFFF' },
                                '&.Mui-focused fieldset': { borderColor: '#02FF95' }
                            },
                            '& input': { color: '#FFFFFF' }
                        } }), (0, jsx_runtime_1.jsx)(material_1.Button, Object.assign({ type: "submit", variant: "contained", disabled: isSubmitting || loading, sx: {
                            backgroundColor: '#02FF95',
                            color: '#000000',
                            '&:hover': {
                                backgroundColor: '#00CC75'
                            }
                        } }, { children: isSubmitting ? 'Submitting...' : 'Submit Release' })), submitError && ((0, jsx_runtime_1.jsx)(material_1.Alert, Object.assign({ severity: "error", sx: { mt: 2 } }, { children: submitError })))] }))] })));
};
exports.ReleaseForm = ReleaseForm;
exports.default = exports.ReleaseForm;
