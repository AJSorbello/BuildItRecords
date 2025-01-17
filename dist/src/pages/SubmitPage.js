"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const material_1 = require("@mui/material");
const Remove_1 = __importDefault(require("@mui/icons-material/Remove"));
const Add_1 = __importDefault(require("@mui/icons-material/Add"));
const react_router_dom_1 = require("react-router-dom");
const labels_1 = require("../constants/labels");
const config_1 = __importDefault(require("../config")); // Assuming config file is in the same directory
const StyledCard = (0, material_1.styled)(material_1.Card)({
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    padding: '24px',
});
const FormSection = (_a) => {
    var { children } = _a, props = __rest(_a, ["children"]);
    return ((0, jsx_runtime_1.jsx)(StyledCard, Object.assign({ sx: Object.assign({ marginBottom: '24px' }, props.sx) }, { children: children })));
};
const buttonStyle = {
    backgroundColor: '#02FF95',
    color: '#121212',
    '&:hover': {
        backgroundColor: '#00CC76',
    },
};
const SubmitPage = ({ label }) => {
    const navigate = (0, react_router_dom_1.useNavigate)();
    const [open, setOpen] = (0, react_1.useState)(false);
    const [termsAccepted, setTermsAccepted] = (0, react_1.useState)(false);
    const [artists, setArtists] = react_1.default.useState([{
            fullName: '',
            name: '',
            email: '',
            country: '',
            province: '',
            facebook: '',
            twitter: '',
            instagram: '',
            soundcloud: '',
            spotify: '',
            appleMusic: '',
        }]);
    const [tracks, setTracks] = react_1.default.useState([{
            title: '',
            soundCloudPrivateLink: '',
            genre: '',
        }]);
    const [error, setError] = (0, react_1.useState)('');
    const [success, setSuccess] = (0, react_1.useState)('');
    const handleArtistChange = (index, field, value) => {
        const newArtists = [...artists];
        newArtists[index] = Object.assign(Object.assign({}, newArtists[index]), { [field]: value });
        setArtists(newArtists);
    };
    const handleTrackChange = (index, field, value) => {
        const newTracks = [...tracks];
        newTracks[index] = Object.assign(Object.assign({}, newTracks[index]), { [field]: value });
        setTracks(newTracks);
    };
    const addArtist = () => {
        setArtists([...artists, {
                fullName: '',
                name: '',
                email: '',
                country: '',
                province: '',
                facebook: '',
                twitter: '',
                instagram: '',
                soundcloud: '',
                spotify: '',
                appleMusic: '',
            }]);
    };
    const removeArtist = (index) => {
        if (artists.length > 1) {
            setArtists(artists.filter((_, i) => i !== index));
        }
    };
    const addTrack = () => {
        setTracks([...tracks, { title: '', soundCloudPrivateLink: '', genre: '' }]);
    };
    const removeTrack = (index) => {
        if (tracks.length > 1) {
            setTracks(tracks.filter((_, i) => i !== index));
        }
    };
    const isValidSoundCloudUrl = (url) => {
        const regex = /^(https?:\/\/)?(www\.)?(soundcloud\.com|snd\.sc)\/[\w-]+\/[\w-]+$/;
        return regex.test(url);
    };
    const handleSubmit = (event) => __awaiter(void 0, void 0, void 0, function* () {
        event.preventDefault();
        if (!termsAccepted) {
            setError('You must accept the terms and conditions to submit.');
            return;
        }
        try {
            const artist = artists[0]; // Assuming single artist for simplicity
            const track = tracks[0]; // Assuming single track for simplicity
            if (!isValidSoundCloudUrl(track.soundCloudPrivateLink)) {
                setError('Please enter a valid SoundCloud URL.');
                return;
            }
            const response = yield fetch(`${config_1.default.API_URL}/submit-demo`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    artist: {
                        fullName: artist.fullName,
                        name: artist.name,
                        email: artist.email,
                        country: artist.country,
                        province: artist.province,
                        facebook: artist.facebook,
                        twitter: artist.twitter,
                        instagram: artist.instagram,
                        soundcloud: artist.soundcloud,
                        spotify: artist.spotify,
                        appleMusic: artist.appleMusic
                    },
                    track: {
                        title: track.title,
                        genre: track.genre,
                        soundCloudPrivateLink: track.soundCloudPrivateLink
                    }
                }),
            });
            if (!response.ok) {
                throw new Error('Failed to submit form');
            }
            // Clear form
            setArtists([{
                    fullName: '',
                    name: '',
                    email: '',
                    country: '',
                    province: '',
                    facebook: '',
                    twitter: '',
                    instagram: '',
                    soundcloud: '',
                    spotify: '',
                    appleMusic: '',
                }]);
            setTracks([{
                    title: '',
                    soundCloudPrivateLink: '',
                    genre: '',
                }]);
            setTermsAccepted(false);
            setError('');
            setSuccess('Form submitted successfully! We will review your submission and get back to you soon.');
            setOpen(true); // Open modal on success
            setTimeout(() => {
                console.log('Closing modal and redirecting to home.');
                setOpen(false);
                navigate('/'); // Redirect to home
            }, 3000);
        }
        catch (error) {
            console.error('Submission error:', error);
            setError('Failed to submit form. Please try again later.');
        }
    });
    const recordLabel = labels_1.labelIdToKey[label];
    const labelDisplay = recordLabel.charAt(0).toUpperCase() + recordLabel.slice(1);
    return ((0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ component: "form", onSubmit: handleSubmit, sx: {
            maxWidth: 800,
            mx: 'auto',
            p: 3,
            mt: '80px',
            mb: 4,
        } }, { children: [(0, jsx_runtime_1.jsxs)(material_1.Typography, Object.assign({ variant: "h3", component: "h1", gutterBottom: true, sx: { color: 'text.primary', mb: 4 } }, { children: ["Submit Demo to Build It ", labelDisplay] })), (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "body1", sx: { color: 'text.secondary', mb: 4 } }, { children: "Build It Records is dedicated to showcasing emerging and accomplished underground house music producers. We're constantly seeking fresh, innovative sounds that push the boundaries of underground electronic music." })), (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h5", gutterBottom: true, sx: { color: 'text.primary', mt: 4 } }, { children: "Artist Information" })), artists.map((artist, index) => ((0, jsx_runtime_1.jsxs)(FormSection, { children: [(0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 } }, { children: [(0, jsx_runtime_1.jsxs)(material_1.Typography, Object.assign({ variant: "h6" }, { children: ["Artist ", index + 1] })), artists.length > 1 && ((0, jsx_runtime_1.jsx)(material_1.IconButton, Object.assign({ onClick: () => removeArtist(index), color: "error" }, { children: (0, jsx_runtime_1.jsx)(Remove_1.default, {}) })))] })), (0, jsx_runtime_1.jsxs)(material_1.Grid, Object.assign({ container: true, spacing: 2 }, { children: [(0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12, sm: 6 }, { children: (0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, label: "Full Name", value: artist.fullName, onChange: (e) => handleArtistChange(index, 'fullName', e.target.value), required: true, id: `artist-fullname-${index}`, name: `artist-fullname-${index}` }) })), (0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12, sm: 6 }, { children: (0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, label: "Artist Name", value: artist.name, onChange: (e) => handleArtistChange(index, 'name', e.target.value), required: true, id: `artist-name-${index}`, name: `artist-name-${index}` }) })), (0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12, sm: 6 }, { children: (0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, label: "Email", type: "email", value: artist.email, onChange: (e) => handleArtistChange(index, 'email', e.target.value), required: true, id: `artist-email-${index}`, name: `artist-email-${index}` }) })), (0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12, sm: 6 }, { children: (0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, label: "Country", value: artist.country, onChange: (e) => handleArtistChange(index, 'country', e.target.value), required: true, id: `artist-country-${index}`, name: `artist-country-${index}` }) })), (0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12, sm: 6 }, { children: (0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, label: "Province/State", value: artist.province, onChange: (e) => handleArtistChange(index, 'province', e.target.value), required: true, id: `artist-province-${index}`, name: `artist-province-${index}` }) })), (0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12 }, { children: (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "subtitle1", gutterBottom: true }, { children: "Social Media Links" })) })), (0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12, sm: 6 }, { children: (0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, label: "Facebook", value: artist.facebook, onChange: (e) => handleArtistChange(index, 'facebook', e.target.value), id: `artist-facebook-${index}`, name: `artist-facebook-${index}` }) })), (0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12, sm: 6 }, { children: (0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, label: "Twitter/X", value: artist.twitter, onChange: (e) => handleArtistChange(index, 'twitter', e.target.value), id: `artist-twitter-${index}`, name: `artist-twitter-${index}` }) })), (0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12, sm: 6 }, { children: (0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, label: "Instagram", value: artist.instagram, onChange: (e) => handleArtistChange(index, 'instagram', e.target.value), id: `artist-instagram-${index}`, name: `artist-instagram-${index}` }) })), (0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12, sm: 6 }, { children: (0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, label: "SoundCloud", value: artist.soundcloud, onChange: (e) => handleArtistChange(index, 'soundcloud', e.target.value), id: `artist-soundcloud-${index}`, name: `artist-soundcloud-${index}` }) })), (0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12, sm: 6 }, { children: (0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, label: "Spotify", value: artist.spotify, onChange: (e) => handleArtistChange(index, 'spotify', e.target.value), id: `artist-spotify-${index}`, name: `artist-spotify-${index}` }) })), (0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12 }, { children: (0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, label: "Apple Music", value: artist.appleMusic, onChange: (e) => handleArtistChange(index, 'appleMusic', e.target.value), id: `artist-applemusic-${index}`, name: `artist-applemusic-${index}` }) }))] }))] }, index))), (0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ sx: { mb: 4 } }, { children: (0, jsx_runtime_1.jsx)(material_1.Button, Object.assign({ variant: "contained", startIcon: (0, jsx_runtime_1.jsx)(Add_1.default, {}), onClick: addArtist, sx: buttonStyle }, { children: "Add Artist" })) })), (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h5", gutterBottom: true, sx: { color: 'text.primary', mt: 4 } }, { children: "Track Information" })), tracks.map((track, index) => ((0, jsx_runtime_1.jsxs)(FormSection, { children: [(0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 } }, { children: [(0, jsx_runtime_1.jsxs)(material_1.Typography, Object.assign({ variant: "h6" }, { children: ["Track ", index + 1] })), tracks.length > 1 && ((0, jsx_runtime_1.jsx)(material_1.IconButton, Object.assign({ onClick: () => removeTrack(index), color: "error" }, { children: (0, jsx_runtime_1.jsx)(Remove_1.default, {}) })))] })), (0, jsx_runtime_1.jsxs)(material_1.Grid, Object.assign({ container: true, spacing: 2 }, { children: [(0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12 }, { children: (0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, label: "Track Title", value: track.title, onChange: (e) => handleTrackChange(index, 'title', e.target.value), required: true, id: `track-title-${index}`, name: `track-title-${index}` }) })), (0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12 }, { children: (0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, label: "Genre", value: track.genre, onChange: (e) => handleTrackChange(index, 'genre', e.target.value), required: true, helperText: "e.g., Deep House, Tech House, Progressive House", id: `track-genre-${index}`, name: `track-genre-${index}` }) })), (0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12 }, { children: (0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, label: "SoundCloud Private Link", value: track.soundCloudPrivateLink, onChange: (e) => handleTrackChange(index, 'soundCloudPrivateLink', e.target.value), required: true, helperText: "Please provide a private SoundCloud link for your track", id: `track-soundcloud-${index}`, name: `track-soundcloud-${index}` }) }))] }))] }, index))), (0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ sx: { mb: 4 } }, { children: (0, jsx_runtime_1.jsx)(material_1.Button, Object.assign({ variant: "contained", startIcon: (0, jsx_runtime_1.jsx)(Add_1.default, {}), onClick: addTrack, sx: buttonStyle }, { children: "Add Track" })) })), (0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ sx: { mt: 6, mb: 4 } }, { children: (0, jsx_runtime_1.jsxs)(FormSection, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h6", gutterBottom: true, sx: { color: 'text.primary' } }, { children: "Submission Guidelines & Terms" })), (0, jsx_runtime_1.jsxs)(material_1.Typography, Object.assign({ variant: "body2", component: "div", sx: { color: 'text.secondary' } }, { children: ["\u2022 Please allow up to 7 days for us to review your submission", (0, jsx_runtime_1.jsx)("br", {}), "\u2022 All submissions must be 100% royalty-free or will be rejected immediately", (0, jsx_runtime_1.jsx)("br", {}), "\u2022 Royalties are split 50/50 between artists and label", (0, jsx_runtime_1.jsx)("br", {}), "\u2022 Only submit unreleased, original material", (0, jsx_runtime_1.jsx)("br", {}), "\u2022 We accept demos in WAV format only - premasters no limiters on master/stereo bus", (0, jsx_runtime_1.jsx)("br", {}), "\u2022 By submitting, you confirm that this is original work and you own all rights"] }))] }) })), (0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ sx: { mt: 4 } }, { children: [(0, jsx_runtime_1.jsx)(material_1.FormControlLabel, { control: (0, jsx_runtime_1.jsx)(material_1.Checkbox, { checked: termsAccepted, onChange: (e) => setTermsAccepted(e.target.checked), sx: {
                                color: '#02FF95',
                                '&.Mui-checked': {
                                    color: '#02FF95',
                                },
                            }, id: "terms-checkbox", name: "terms-checkbox" }), label: (0, jsx_runtime_1.jsxs)(material_1.Typography, Object.assign({ variant: "body2", sx: { color: 'text.secondary' } }, { children: ["I accept the", ' ', (0, jsx_runtime_1.jsx)(material_1.Link, Object.assign({ href: "/legal", target: "_blank", sx: {
                                        color: '#02FF95',
                                        textDecoration: 'none',
                                        '&:hover': {
                                            textDecoration: 'underline',
                                        },
                                    } }, { children: "Terms of Service and Privacy Policy" }))] })) }), (0, jsx_runtime_1.jsx)(material_1.Button, Object.assign({ type: "submit", variant: "contained", size: "large", fullWidth: true, disabled: !termsAccepted, sx: Object.assign(Object.assign({}, buttonStyle), { mt: 2, opacity: termsAccepted ? 1 : 0.5 }) }, { children: "Submit Demo" })), error && ((0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "body2", sx: { color: 'error.main', mt: 2 } }, { children: error }))), success && ((0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "body2", sx: { color: 'success.main', mt: 2 } }, { children: success })))] })), (0, jsx_runtime_1.jsx)(material_1.Modal, Object.assign({ open: open, onClose: () => setOpen(false), "aria-labelledby": "modal-modal-title", "aria-describedby": "modal-modal-description" }, { children: (0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ sx: {
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 400,
                        bgcolor: 'background.paper',
                        border: '2px solid #000',
                        boxShadow: 24,
                        p: 4,
                    } }, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ id: "modal-modal-title", variant: "h6", component: "h2" }, { children: "Demo Submission Successful" })), (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ id: "modal-modal-description", sx: { mt: 2 } }, { children: "Your demo has been submitted successfully. We will review it and get back to you within 7 days." }))] })) }))] })));
};
exports.default = SubmitPage;
