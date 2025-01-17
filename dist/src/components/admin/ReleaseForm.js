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
const SpotifyService_1 = require("../../services/SpotifyService");
const ReleaseForm = ({ onSubmit, onCancel }) => {
    const [spotifyUrl, setSpotifyUrl] = (0, react_1.useState)('');
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const isValidSpotifyUrl = (url) => {
        return url.includes('spotify.com/track/');
    };
    const extractTrackId = (url) => {
        const match = url.match(/track\/([a-zA-Z0-9]+)/);
        return match ? match[1] : null;
    };
    const handleSubmit = (e) => __awaiter(void 0, void 0, void 0, function* () {
        e.preventDefault();
        setError(null);
        if (!isValidSpotifyUrl(spotifyUrl)) {
            setError('Please enter a valid Spotify track URL');
            return;
        }
        const trackId = extractTrackId(spotifyUrl);
        if (!trackId) {
            setError('Could not extract track ID from URL');
            return;
        }
        setLoading(true);
        try {
            const track = yield SpotifyService_1.spotifyService.getTrack(trackId);
            if (!track) {
                throw new Error('Failed to fetch track details');
            }
            onSubmit(track);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        }
        finally {
            setLoading(false);
        }
    });
    return ((0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ component: "form", onSubmit: handleSubmit, sx: { width: '100%', mt: 2 } }, { children: [(0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, label: "Spotify Track URL", value: spotifyUrl, onChange: (e) => setSpotifyUrl(e.target.value), error: !!error, helperText: error || 'Enter the Spotify URL of the track', disabled: loading, sx: { mb: 2 } }), (0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ sx: { display: 'flex', gap: 2, justifyContent: 'flex-end' } }, { children: [(0, jsx_runtime_1.jsx)(material_1.Button, Object.assign({ variant: "outlined", onClick: onCancel, disabled: loading }, { children: "Cancel" })), (0, jsx_runtime_1.jsx)(material_1.Button, Object.assign({ type: "submit", variant: "contained", disabled: loading || !spotifyUrl }, { children: loading ? (0, jsx_runtime_1.jsx)(material_1.CircularProgress, { size: 24 }) : 'Add Track' }))] }))] })));
};
exports.default = ReleaseForm;
