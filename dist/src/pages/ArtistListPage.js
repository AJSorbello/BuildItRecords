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
const PageLayout_1 = __importDefault(require("../components/PageLayout"));
const SpotifyService_1 = require("../services/SpotifyService");
const config_1 = __importDefault(require("../config"));
const groupByArtists = (releases) => {
    const artistMap = new Map();
    releases.forEach(release => {
        const artistKey = release.artist.name;
        if (!artistMap.has(artistKey)) {
            artistMap.set(artistKey, {
                name: release.artist.name,
                releases: [],
                genres: [],
                imageUrl: undefined,
                spotifyUrl: release.artist.spotifyUrl,
                id: undefined
            });
        }
        const artist = artistMap.get(artistKey);
        artist.releases.push(release);
    });
    return Array.from(artistMap.values());
};
const filterByLabel = (artists, label) => {
    const labelMap = {
        'records': 'build-it-records',
        'tech': 'build-it-tech',
        'deep': 'build-it-deep'
    };
    return artists.filter(artist => artist.releases.some(release => release.recordLabel === labelMap[label]));
};
const StyledCard = (0, material_1.styled)(material_1.Card)(({ theme }) => ({
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    transition: 'transform 0.2s',
    '&:hover': {
        transform: 'scale(1.02)',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    '&::before': {
        content: '""',
        display: 'block',
        paddingTop: '100%', // This creates the 1:1 ratio
    },
}));
const CardMediaWrapper = (0, material_1.styled)(material_1.Box)({
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: '30%', // Reserve space for content at bottom
});
const CardContentWrapper = (0, material_1.styled)(material_1.CardContent)({
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(10px)',
});
const ArtistListPage = () => {
    const { label } = (0, react_router_dom_1.useParams)();
    const [artists, setArtists] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const fetchArtistImage = (artistName, track) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        try {
            // Extract primary artist name if it's a collaboration
            const primaryArtist = artistName.split(/[,&]|\bfeat\b|\bft\b|\bx\b|\bvs\b/i)[0].trim();
            console.log('Fetching image for primary artist:', primaryArtist);
            // Try to get artist details from Spotify
            const artistDetails = yield SpotifyService_1.spotifyService.getArtistDetailsByName(primaryArtist);
            if ((_b = (_a = artistDetails === null || artistDetails === void 0 ? void 0 : artistDetails.images) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.url) {
                console.log('Found Spotify image for artist:', primaryArtist);
                return artistDetails.images[0].url;
            }
            else {
                console.log('No Spotify image found for artist:', primaryArtist);
                // Fall back to track album cover if no artist image found
                return track.artwork || 'https://via.placeholder.com/300';
            }
        }
        catch (error) {
            console.error('Error fetching artist image:', error);
            return track.artwork || 'https://via.placeholder.com/300';
        }
    });
    (0, react_1.useEffect)(() => {
        const loadArtists = () => __awaiter(void 0, void 0, void 0, function* () {
            try {
                setLoading(true);
                const releases = yield fetch(`${config_1.default.API_URL}/releases`).then(res => res.json());
                console.log('Getting artists for label:', label);
                const allArtists = groupByArtists(releases);
                const filteredArtists = filterByLabel(allArtists, label || 'records');
                // Get Spotify details for each artist
                const artistsWithSpotifyDetails = yield Promise.all(filteredArtists.map((artist) => __awaiter(void 0, void 0, void 0, function* () {
                    var _a, _b, _c, _d;
                    try {
                        // Extract only the first artist name for the search
                        const primaryArtist = artist.name.split(/[,&]/)[0].trim();
                        console.log(`Processing artist: ${primaryArtist} (from: ${artist.name})`);
                        // Try to get artist details from Spotify using artist name first
                        const spotifyArtist = yield SpotifyService_1.spotifyService.getArtistDetailsByName(primaryArtist);
                        if (spotifyArtist && ((_a = spotifyArtist.images) === null || _a === void 0 ? void 0 : _a.length) > 0) {
                            console.log(`Found Spotify artist: ${spotifyArtist.name}`);
                            console.log(`Image URL: ${spotifyArtist.images[0].url}`);
                            return Object.assign(Object.assign({}, artist), { imageUrl: spotifyArtist.images[0].url || '', genres: spotifyArtist.genres || [], spotifyUrl: ((_b = spotifyArtist.external_urls) === null || _b === void 0 ? void 0 : _b.spotify) || '', id: spotifyArtist.id });
                        }
                        // If no artist found with just the name, try with a track title
                        const firstRelease = artist.releases[0];
                        if (firstRelease) {
                            // Remove any "Original Mix" or "Remix" suffixes for better search
                            const cleanTrackTitle = firstRelease.title.replace(/[\s-]+(Original Mix|Remix)$/i, '');
                            console.log(`Trying with track title for ${primaryArtist}: ${cleanTrackTitle}`);
                            const spotifyArtistWithTrack = yield SpotifyService_1.spotifyService.getArtistDetailsByName(primaryArtist);
                            if ((spotifyArtistWithTrack === null || spotifyArtistWithTrack === void 0 ? void 0 : spotifyArtistWithTrack.images) && Array.isArray(spotifyArtistWithTrack.images) && spotifyArtistWithTrack.images.length > 0) {
                                console.log(`Found Spotify artist using track: ${spotifyArtistWithTrack.name}`);
                                const imageUrl = (_c = spotifyArtistWithTrack.images[0]) === null || _c === void 0 ? void 0 : _c.url;
                                console.log(`Image URL: ${imageUrl}`);
                                return Object.assign(Object.assign({}, artist), { imageUrl: imageUrl || artist.imageUrl || '', genres: spotifyArtistWithTrack.genres || [], spotifyUrl: ((_d = spotifyArtistWithTrack.external_urls) === null || _d === void 0 ? void 0 : _d.spotify) || '', id: spotifyArtistWithTrack.id });
                            }
                        }
                        // If no Spotify image found, use default image
                        console.log(`No Spotify profile image found for ${primaryArtist}`);
                        return Object.assign(Object.assign({}, artist), { imageUrl: '/default-artist-image.jpg' });
                    }
                    catch (error) {
                        console.error(`Error getting Spotify details for ${artist.name}:`, error);
                    }
                    // If all attempts fail, return artist without image
                    console.warn(`No valid image found for ${artist.name}`);
                    return Object.assign(Object.assign({}, artist), { imageUrl: undefined // Explicitly set to undefined to indicate no valid image
                     });
                })));
                // Fetch artist images
                const artistsWithImages = yield Promise.all(artistsWithSpotifyDetails.map((artist) => __awaiter(void 0, void 0, void 0, function* () {
                    if (!artist.imageUrl) {
                        const firstRelease = artist.releases[0];
                        if (firstRelease) {
                            const image = yield fetchArtistImage(artist.name, firstRelease);
                            return Object.assign(Object.assign({}, artist), { imageUrl: image });
                        }
                    }
                    return artist;
                })));
                setArtists(artistsWithImages);
            }
            catch (error) {
                console.error('Error loading artists:', error);
            }
            finally {
                setLoading(false);
            }
        });
        loadArtists();
    }, [label]);
    if (loading) {
        return ((0, jsx_runtime_1.jsx)(PageLayout_1.default, Object.assign({ label: label || 'records' }, { children: (0, jsx_runtime_1.jsx)(material_1.Typography, { children: "Loading artists..." }) })));
    }
    const fetchArtistDetails = (artistName) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const artistDetails = yield SpotifyService_1.spotifyService.getArtistDetailsByName(artistName);
            return artistDetails;
        }
        catch (error) {
            console.error('Error fetching artist details:', error);
            return null;
        }
    });
    return ((0, jsx_runtime_1.jsx)(PageLayout_1.default, Object.assign({ label: label || 'records' }, { children: (0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ mb: 4 }, { children: [(0, jsx_runtime_1.jsxs)(material_1.Typography, Object.assign({ variant: "h5", gutterBottom: true, sx: { color: 'text.primary' } }, { children: ["Artists (", artists.length, ")"] })), (0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ container: true, spacing: 3 }, { children: artists.map((artist) => ((0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12, sm: 6, md: 4, lg: 3 }, { children: (0, jsx_runtime_1.jsx)(react_router_dom_1.Link, Object.assign({ to: `/artist/${encodeURIComponent(artist.name)}`, style: { textDecoration: 'none' } }, { children: (0, jsx_runtime_1.jsxs)(StyledCard, { children: [(0, jsx_runtime_1.jsx)(CardMediaWrapper, { children: (0, jsx_runtime_1.jsx)(material_1.CardMedia, { component: "img", image: artist.imageUrl, alt: artist.name, sx: {
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                objectPosition: 'center top',
                                                backgroundColor: 'rgba(0, 0, 0, 0.1)'
                                            }, onError: (e) => {
                                                var _a, _b, _c, _d;
                                                const img = e.target;
                                                console.log(`Image load error for ${artist.name}, current src: ${img.src}`);
                                                if (img.src !== ((_a = artist.releases[0]) === null || _a === void 0 ? void 0 : _a.artwork)) {
                                                    console.log(`Falling back to release artwork for ${artist.name}: ${(_b = artist.releases[0]) === null || _b === void 0 ? void 0 : _b.artwork}`);
                                                    img.src = ((_c = artist.releases[0]) === null || _c === void 0 ? void 0 : _c.artwork) || '/default-artist.png';
                                                }
                                                else if ((_d = artist.releases[0]) === null || _d === void 0 ? void 0 : _d.artwork) {
                                                    console.log(`Release artwork also failed for ${artist.name}, using default image`);
                                                    img.src = '/default-artist.png';
                                                }
                                            } }) }), (0, jsx_runtime_1.jsxs)(CardContentWrapper, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h6", component: "div", sx: {
                                                    color: 'text.primary',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                } }, { children: artist.name })), artist.genres.length > 0 && ((0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "body2", color: "text.secondary", sx: {
                                                    mb: 0.5,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                } }, { children: artist.genres.slice(0, 2).join(', ') }))), (0, jsx_runtime_1.jsxs)(material_1.Typography, Object.assign({ variant: "body2", color: "text.secondary" }, { children: [artist.releases.length, " ", artist.releases.length === 1 ? 'Release' : 'Releases'] }))] })] }) })) }), artist.name))) }))] })) })));
};
exports.default = ArtistListPage;
