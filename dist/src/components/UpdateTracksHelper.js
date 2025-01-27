"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const labels_1 = require("../constants/labels");
const UpdateTracksHelper = () => {
    (0, react_1.useEffect)(() => {
        // Get current tracks from localStorage
        const tracksJson = localStorage.getItem('tracks');
        if (!tracksJson) {
            console.log('No tracks found in localStorage');
            return;
        }
        const tracks = JSON.parse(tracksJson);
        console.log('Current tracks:', tracks);
        // Update tracks that should be under Build It Deep
        const updatedTracks = tracks.map((track) => {
            // If the track was previously imported but not assigned to Deep, update it
            if (track.spotifyUrl && track.recordLabel !== labels_1.RECORD_LABELS.DEEP) {
                return Object.assign(Object.assign({}, track), { recordLabel: labels_1.RECORD_LABELS.DEEP });
            }
            return track;
        });
        // Save updated tracks back to localStorage
        localStorage.setItem('tracks', JSON.stringify(updatedTracks));
        console.log('Updated tracks:', updatedTracks);
        // Force a page reload to reflect changes
        window.location.reload();
    }, []);
    return ((0, jsx_runtime_1.jsx)("div", Object.assign({ style: { padding: '20px' } }, { children: "Updating tracks... Check the console for details." })));
};
exports.default = UpdateTracksHelper;
