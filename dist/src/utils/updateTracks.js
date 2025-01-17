"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Get current tracks from localStorage
const updateTracks = () => {
    const tracksJson = localStorage.getItem('tracks');
    if (!tracksJson)
        return;
    const tracks = JSON.parse(tracksJson);
    const updatedTracks = tracks.map(track => {
        // If the track was previously imported but not assigned to Deep, update it
        if (track.spotifyUrl && track.recordLabel && !track.recordLabel.includes('Deep')) {
            return Object.assign(Object.assign({}, track), { recordLabel: 'Build It Deep' });
        }
        return track;
    });
    localStorage.setItem('tracks', JSON.stringify(updatedTracks));
};
exports.default = updateTracks;
