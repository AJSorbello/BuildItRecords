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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const styled_components_1 = __importDefault(require("styled-components"));
const framer_motion_1 = require("framer-motion");
const LoadingAnimation_1 = __importDefault(require("./LoadingAnimation"));
const config_1 = __importDefault(require("../config")); // assuming config file is in the parent directory
const Container = styled_components_1.default.div `
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;
const Header = styled_components_1.default.div `
  margin-bottom: 2rem;
`;
const Controls = styled_components_1.default.div `
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
`;
const Input = styled_components_1.default.input `
  flex: 1;
  min-width: 300px;
  padding: 1rem;
  font-size: 1.1rem;
  border: 2px solid #eee;
  border-radius: 8px;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #007AFF;
    box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
  }
`;
const Select = styled_components_1.default.select `
  padding: 1rem;
  font-size: 1.1rem;
  border: 2px solid #eee;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  min-width: 150px;

  &:focus {
    outline: none;
    border-color: #007AFF;
  }
`;
const FilterInput = (0, styled_components_1.default)(Input) `
  max-width: 300px;
  flex: 0.5;
`;
const LabelsContainer = styled_components_1.default.div `
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
`;
const LabelSection = (0, styled_components_1.default)(framer_motion_1.motion.div) `
  background: ${props => { var _a; return ((_a = props.theme[props.label]) === null || _a === void 0 ? void 0 : _a.background) || '#fff'; }};
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;
const LabelHeader = styled_components_1.default.div `
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  position: sticky;
  top: 0;
  background: inherit;
  padding: 0.5rem;
  z-index: 1;
`;
const LabelTitle = styled_components_1.default.h2 `
  margin: 0;
  color: ${props => { var _a; return ((_a = props.theme[props.label]) === null || _a === void 0 ? void 0 : _a.text) || '#000'; }};
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;
const TrackCount = styled_components_1.default.span `
  background: ${props => { var _a; return ((_a = props.theme[props.label]) === null || _a === void 0 ? void 0 : _a.accent) || '#eee'; }};
  color: ${props => { var _a; return ((_a = props.theme[props.label]) === null || _a === void 0 ? void 0 : _a.text) || '#000'; }};
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.9rem;
`;
const TrackList = styled_components_1.default.div `
  display: grid;
  gap: 1rem;
  max-height: 600px;
  overflow-y: auto;
  padding-right: 0.5rem;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
  }
`;
const Track = (0, styled_components_1.default)(framer_motion_1.motion.div) `
  display: grid;
  grid-template-columns: 60px 1fr auto;
  gap: 1rem;
  align-items: center;
  background: rgba(255, 255, 255, 0.9);
  padding: 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;
const AlbumArt = styled_components_1.default.img `
  width: 60px;
  height: 60px;
  border-radius: 4px;
  object-fit: cover;
`;
const TrackInfo = styled_components_1.default.div `
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;
const TrackName = styled_components_1.default.div `
  font-weight: 600;
  color: ${props => props.explicit ? '#e91e63' : 'inherit'};
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;
const ExplicitBadge = styled_components_1.default.span `
  background: #e91e63;
  color: white;
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
  font-size: 0.7rem;
  font-weight: bold;
`;
const ArtistName = styled_components_1.default.div `
  font-size: 0.9rem;
  color: #666;
`;
const Duration = styled_components_1.default.div `
  color: #666;
  font-size: 0.9rem;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
`;
const Popularity = styled_components_1.default.div `
  font-size: 0.8rem;
  color: #888;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;
const PopularityBar = styled_components_1.default.div `
  width: 50px;
  height: 4px;
  background: #eee;
  border-radius: 2px;
  overflow: hidden;

  &::after {
    content: '';
    display: block;
    width: ${props => props.value}%;
    height: 100%;
    background: ${props => {
    if (props.value >= 70)
        return '#4caf50';
    if (props.value >= 40)
        return '#ff9800';
    return '#f44336';
}};
  }
`;
const theme = {
    BUILD_IT_RECORDS: {
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        text: '#212529',
        accent: '#e9ecef'
    },
    BUILD_IT_TECH: {
        background: 'linear-gradient(135deg, #f1f8ff 0%, #def 100%)',
        text: '#0366d6',
        accent: '#def'
    },
    BUILD_IT_DEEP: {
        background: 'linear-gradient(135deg, #f6f8fa 0%, #eaecef 100%)',
        text: '#24292e',
        accent: '#eaecef'
    }
};
const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds.padStart(2, '0')}`;
};
const MusicLibrary = () => {
    const [url, setUrl] = (0, react_1.useState)('');
    const [tracks, setTracks] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const [filter, setFilter] = (0, react_1.useState)('');
    const [sortBy, setSortBy] = (0, react_1.useState)('release_date');
    const handleSubmit = (e) => __awaiter(void 0, void 0, void 0, function* () {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const response = yield fetch(`${config_1.default.API_URL}/process/url`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url }),
            });
            if (!response.ok) {
                throw new Error('Failed to process URL');
            }
            const data = yield response.json();
            setTracks(data.tracks);
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setLoading(false);
        }
    });
    const handleTrackClick = (track) => {
        if (track.preview_url) {
            window.open(track.preview_url, '_blank');
        }
    };
    const filterAndSortTracks = (labelTracks) => {
        let filtered = labelTracks;
        if (filter) {
            const searchTerm = filter.toLowerCase();
            filtered = labelTracks.filter(track => track.name.toLowerCase().includes(searchTerm) ||
                track.artists.some(artist => artist.name.toLowerCase().includes(searchTerm)));
        }
        return filtered.sort((a, b) => {
            switch (sortBy) {
                case 'release_date':
                    return new Date(b.album.release_date) - new Date(a.album.release_date);
                case 'popularity':
                    return b.popularity - a.popularity;
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'duration':
                    return a.duration_ms - b.duration_ms;
                default:
                    return 0;
            }
        });
    };
    return ((0, jsx_runtime_1.jsxs)(Container, { children: [(0, jsx_runtime_1.jsxs)(Header, { children: [(0, jsx_runtime_1.jsx)("form", Object.assign({ onSubmit: handleSubmit }, { children: (0, jsx_runtime_1.jsxs)(Controls, { children: [(0, jsx_runtime_1.jsx)(Input, { type: "text", placeholder: "Paste Spotify URL here...", value: url, onChange: (e) => setUrl(e.target.value), disabled: loading }), (0, jsx_runtime_1.jsx)(FilterInput, { type: "text", placeholder: "Filter tracks...", value: filter, onChange: (e) => setFilter(e.target.value) }), (0, jsx_runtime_1.jsxs)(Select, Object.assign({ value: sortBy, onChange: (e) => setSortBy(e.target.value) }, { children: [(0, jsx_runtime_1.jsx)("option", Object.assign({ value: "release_date" }, { children: "Release Date" })), (0, jsx_runtime_1.jsx)("option", Object.assign({ value: "popularity" }, { children: "Popularity" })), (0, jsx_runtime_1.jsx)("option", Object.assign({ value: "name" }, { children: "Name" })), (0, jsx_runtime_1.jsx)("option", Object.assign({ value: "duration" }, { children: "Duration" }))] }))] }) })), error && ((0, jsx_runtime_1.jsx)(framer_motion_1.motion.div, Object.assign({ initial: { opacity: 0 }, animate: { opacity: 1 }, style: { color: 'red', marginTop: '0.5rem' } }, { children: error })))] }), loading && (0, jsx_runtime_1.jsx)(LoadingAnimation_1.default, {}), (0, jsx_runtime_1.jsx)(framer_motion_1.AnimatePresence, { children: tracks && ((0, jsx_runtime_1.jsx)(LabelsContainer, { children: Object.entries(tracks).map(([label, labelTracks]) => {
                        const filteredTracks = filterAndSortTracks(labelTracks);
                        return ((0, jsx_runtime_1.jsxs)(LabelSection, Object.assign({ label: label, initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 } }, { children: [(0, jsx_runtime_1.jsxs)(LabelHeader, { children: [(0, jsx_runtime_1.jsx)(LabelTitle, Object.assign({ label: label }, { children: label.replace('BUILD_IT_', '') })), (0, jsx_runtime_1.jsxs)(TrackCount, Object.assign({ label: label }, { children: [filteredTracks.length, " tracks"] }))] }), (0, jsx_runtime_1.jsx)(TrackList, { children: filteredTracks.map((track) => {
                                        var _a;
                                        return ((0, jsx_runtime_1.jsxs)(Track, Object.assign({ onClick: () => handleTrackClick(track), whileHover: { scale: 1.02 }, whileTap: { scale: 0.98 } }, { children: [(0, jsx_runtime_1.jsx)(AlbumArt, { src: (_a = track.album.images[0]) === null || _a === void 0 ? void 0 : _a.url, alt: track.album.name }), (0, jsx_runtime_1.jsxs)(TrackInfo, { children: [(0, jsx_runtime_1.jsxs)(TrackName, Object.assign({ explicit: track.explicit }, { children: [track.name, track.explicit && ((0, jsx_runtime_1.jsx)(ExplicitBadge, { children: "E" }))] })), (0, jsx_runtime_1.jsx)(ArtistName, { children: track.artists.map(a => a.name).join(', ') })] }), (0, jsx_runtime_1.jsxs)(Duration, { children: [formatDuration(track.duration_ms), (0, jsx_runtime_1.jsx)(Popularity, { children: (0, jsx_runtime_1.jsx)(PopularityBar, { value: track.popularity }) })] })] }), track.id));
                                    }) })] }), label));
                    }) })) })] }));
};
exports.default = MusicLibrary;
