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
const material_1 = require("@mui/material");
const EditTrackDialog = ({ open, onClose, onSave, formData, setFormData }) => {
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => (Object.assign(Object.assign({}, prev), { [name]: value })));
    };
    const handleSubmit = (e) => __awaiter(void 0, void 0, void 0, function* () {
        e.preventDefault();
        try {
            const track = {
                id: formData.id,
                name: formData.trackTitle,
                artists: formData.artist.split(',').map(a => a.trim()),
                album: {
                    name: formData.album,
                    artwork_url: formData.albumCover
                },
                releaseDate: formData.releaseDate,
                albumCover: formData.albumCover,
                spotifyUrl: formData.spotifyUrl,
                preview_url: formData.previewUrl,
                beatportUrl: formData.beatportUrl,
                soundcloudUrl: formData.soundcloudUrl
            };
            yield onSave(track);
            onClose();
        }
        catch (error) {
            console.error('Error saving track:', error);
        }
    });
    return ((0, jsx_runtime_1.jsxs)(material_1.Dialog, Object.assign({ open: open, onClose: onClose, maxWidth: "md", fullWidth: true }, { children: [(0, jsx_runtime_1.jsx)(material_1.DialogTitle, { children: "Edit Track" }), (0, jsx_runtime_1.jsxs)("form", Object.assign({ onSubmit: handleSubmit }, { children: [(0, jsx_runtime_1.jsx)(material_1.DialogContent, { children: (0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ sx: { display: 'flex', flexDirection: 'column', gap: 2 } }, { children: [(0, jsx_runtime_1.jsx)(material_1.TextField, { name: "trackTitle", label: "Track Title", value: formData.trackTitle, onChange: handleChange, fullWidth: true }), (0, jsx_runtime_1.jsx)(material_1.TextField, { name: "artist", label: "Artist(s)", value: formData.artist, onChange: handleChange, fullWidth: true, helperText: "Separate multiple artists with commas" }), (0, jsx_runtime_1.jsx)(material_1.TextField, { name: "album", label: "Album", value: formData.album, onChange: handleChange, fullWidth: true }), (0, jsx_runtime_1.jsx)(material_1.TextField, { name: "releaseDate", label: "Release Date", type: "date", value: formData.releaseDate, onChange: handleChange, fullWidth: true, InputLabelProps: { shrink: true } }), (0, jsx_runtime_1.jsx)(material_1.TextField, { name: "albumCover", label: "Album Cover URL", value: formData.albumCover, onChange: handleChange, fullWidth: true }), (0, jsx_runtime_1.jsx)(material_1.TextField, { name: "spotifyUrl", label: "Spotify URL", value: formData.spotifyUrl, onChange: handleChange, fullWidth: true }), (0, jsx_runtime_1.jsx)(material_1.TextField, { name: "previewUrl", label: "Preview URL", value: formData.previewUrl, onChange: handleChange, fullWidth: true }), (0, jsx_runtime_1.jsx)(material_1.TextField, { name: "beatportUrl", label: "Beatport URL", value: formData.beatportUrl, onChange: handleChange, fullWidth: true }), (0, jsx_runtime_1.jsx)(material_1.TextField, { name: "soundcloudUrl", label: "SoundCloud URL", value: formData.soundcloudUrl, onChange: handleChange, fullWidth: true })] })) }), (0, jsx_runtime_1.jsxs)(material_1.DialogActions, { children: [(0, jsx_runtime_1.jsx)(material_1.Button, Object.assign({ onClick: onClose }, { children: "Cancel" })), (0, jsx_runtime_1.jsx)(material_1.Button, Object.assign({ type: "submit", variant: "contained", color: "primary" }, { children: "Save" }))] })] }))] })));
};
exports.default = EditTrackDialog;
