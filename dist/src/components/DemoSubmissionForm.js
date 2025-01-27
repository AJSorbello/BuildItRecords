"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const material_1 = require("@mui/material");
const Delete_1 = __importDefault(require("@mui/icons-material/Delete"));
const DemoSubmissionForm = () => {
    const [formData, setFormData] = (0, react_1.useState)({
        label: '',
        artists: [{ fullName: '', country: '', province: '' }],
        artistName: '',
        trackTitles: [''],
        soundcloudLink: '',
        socialLinks: {
            facebook: '',
            twitter: '',
            soundcloud: '',
            spotify: '',
            appleMusic: '',
        },
    });
    const handleAddArtist = () => {
        setFormData(Object.assign(Object.assign({}, formData), { artists: [...formData.artists, { fullName: '', country: '', province: '' }] }));
    };
    const handleRemoveArtist = (index) => {
        const newArtists = formData.artists.filter((_, i) => i !== index);
        setFormData(Object.assign(Object.assign({}, formData), { artists: newArtists }));
    };
    const handleAddTrack = () => {
        setFormData(Object.assign(Object.assign({}, formData), { trackTitles: [...formData.trackTitles, ''] }));
    };
    const handleRemoveTrack = (index) => {
        const newTracks = formData.trackTitles.filter((_, i) => i !== index);
        setFormData(Object.assign(Object.assign({}, formData), { trackTitles: newTracks }));
    };
    const handleSubmit = (event) => {
        event.preventDefault();
        // TODO: Handle form submission
        console.log(formData);
    };
    return ((0, jsx_runtime_1.jsxs)(material_1.Paper, Object.assign({ sx: { p: 3, backgroundColor: 'rgba(255, 255, 255, 0.05)' } }, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h5", gutterBottom: true }, { children: "Demo Submission" })), (0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ component: "form", onSubmit: handleSubmit, sx: { mt: 2 } }, { children: (0, jsx_runtime_1.jsxs)(material_1.Grid, Object.assign({ container: true, spacing: 3 }, { children: [(0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12 }, { children: (0, jsx_runtime_1.jsxs)(material_1.FormControl, Object.assign({ fullWidth: true }, { children: [(0, jsx_runtime_1.jsx)(material_1.InputLabel, { children: "Label" }), (0, jsx_runtime_1.jsxs)(material_1.Select, Object.assign({ value: formData.label, label: "Label", onChange: (e) => setFormData(Object.assign(Object.assign({}, formData), { label: e.target.value })) }, { children: [(0, jsx_runtime_1.jsx)(material_1.MenuItem, Object.assign({ value: "records" }, { children: "Build It Records" })), (0, jsx_runtime_1.jsx)(material_1.MenuItem, Object.assign({ value: "tech" }, { children: "Build It Tech" })), (0, jsx_runtime_1.jsx)(material_1.MenuItem, Object.assign({ value: "deep" }, { children: "Build It Deep" }))] }))] })) })), formData.artists.map((artist, index) => ((0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12 }, { children: (0, jsx_runtime_1.jsx)(material_1.Paper, Object.assign({ sx: { p: 2, backgroundColor: 'rgba(255, 255, 255, 0.02)' } }, { children: (0, jsx_runtime_1.jsxs)(material_1.Grid, Object.assign({ container: true, spacing: 2 }, { children: [(0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12 }, { children: (0, jsx_runtime_1.jsxs)(material_1.Typography, Object.assign({ variant: "subtitle1" }, { children: ["Artist ", index + 1] })) })), (0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12, sm: 6 }, { children: (0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, label: "Full Name", value: artist.fullName, onChange: (e) => {
                                                    const newArtists = [...formData.artists];
                                                    newArtists[index].fullName = e.target.value;
                                                    setFormData(Object.assign(Object.assign({}, formData), { artists: newArtists }));
                                                } }) })), (0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12, sm: 3 }, { children: (0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, label: "Country", value: artist.country, onChange: (e) => {
                                                    const newArtists = [...formData.artists];
                                                    newArtists[index].country = e.target.value;
                                                    setFormData(Object.assign(Object.assign({}, formData), { artists: newArtists }));
                                                } }) })), (0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12, sm: 3 }, { children: (0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, label: "Province", value: artist.province, onChange: (e) => {
                                                    const newArtists = [...formData.artists];
                                                    newArtists[index].province = e.target.value;
                                                    setFormData(Object.assign(Object.assign({}, formData), { artists: newArtists }));
                                                } }) })), index > 0 && ((0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12 }, { children: (0, jsx_runtime_1.jsx)(material_1.IconButton, Object.assign({ onClick: () => handleRemoveArtist(index), color: "error" }, { children: (0, jsx_runtime_1.jsx)(Delete_1.default, {}) })) })))] })) })) }), index))), (0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12 }, { children: (0, jsx_runtime_1.jsx)(material_1.Button, Object.assign({ variant: "outlined", onClick: handleAddArtist }, { children: "Add Additional Artist" })) })), (0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12 }, { children: (0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, label: "Artist/Project Name", value: formData.artistName, onChange: (e) => setFormData(Object.assign(Object.assign({}, formData), { artistName: e.target.value })) }) })), formData.trackTitles.map((track, index) => ((0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12 }, { children: (0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ sx: { display: 'flex', gap: 1 } }, { children: [(0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, label: `Track Title ${index + 1}`, value: track, onChange: (e) => {
                                            const newTracks = [...formData.trackTitles];
                                            newTracks[index] = e.target.value;
                                            setFormData(Object.assign(Object.assign({}, formData), { trackTitles: newTracks }));
                                        } }), index > 0 && ((0, jsx_runtime_1.jsx)(material_1.IconButton, Object.assign({ onClick: () => handleRemoveTrack(index), color: "error" }, { children: (0, jsx_runtime_1.jsx)(Delete_1.default, {}) })))] })) }), index))), (0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12 }, { children: (0, jsx_runtime_1.jsx)(material_1.Button, Object.assign({ variant: "outlined", onClick: handleAddTrack }, { children: "Add Track Title" })) })), (0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12 }, { children: (0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, label: "Soundcloud Private Link", value: formData.soundcloudLink, onChange: (e) => setFormData(Object.assign(Object.assign({}, formData), { soundcloudLink: e.target.value })) }) })), (0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12 }, { children: (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "subtitle1", gutterBottom: true }, { children: "Social Media Links" })) })), (0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12, sm: 6 }, { children: (0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, label: "Facebook", value: formData.socialLinks.facebook, onChange: (e) => setFormData(Object.assign(Object.assign({}, formData), { socialLinks: Object.assign(Object.assign({}, formData.socialLinks), { facebook: e.target.value }) })) }) })), (0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12, sm: 6 }, { children: (0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, label: "Twitter/X", value: formData.socialLinks.twitter, onChange: (e) => setFormData(Object.assign(Object.assign({}, formData), { socialLinks: Object.assign(Object.assign({}, formData.socialLinks), { twitter: e.target.value }) })) }) })), (0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12, sm: 6 }, { children: (0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, label: "Soundcloud", value: formData.socialLinks.soundcloud, onChange: (e) => setFormData(Object.assign(Object.assign({}, formData), { socialLinks: Object.assign(Object.assign({}, formData.socialLinks), { soundcloud: e.target.value }) })) }) })), (0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12, sm: 6 }, { children: (0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, label: "Spotify", value: formData.socialLinks.spotify, onChange: (e) => setFormData(Object.assign(Object.assign({}, formData), { socialLinks: Object.assign(Object.assign({}, formData.socialLinks), { spotify: e.target.value }) })) }) })), (0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12, sm: 6 }, { children: (0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, label: "Apple Music", value: formData.socialLinks.appleMusic, onChange: (e) => setFormData(Object.assign(Object.assign({}, formData), { socialLinks: Object.assign(Object.assign({}, formData.socialLinks), { appleMusic: e.target.value }) })) }) })), (0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12 }, { children: (0, jsx_runtime_1.jsx)(material_1.Button, Object.assign({ variant: "contained", color: "primary", type: "submit" }, { children: "Submit Demo" })) }))] })) }))] })));
};
exports.default = DemoSubmissionForm;
