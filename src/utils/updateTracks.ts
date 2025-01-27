interface Track {
  id: string;
  spotifyUrl?: string;
  recordLabel?: string;
}

// Get current tracks from localStorage
const updateTracks = () => {
  const tracksJson = localStorage.getItem('tracks');
  if (!tracksJson) return;

  const tracks: Track[] = JSON.parse(tracksJson);
  const updatedTracks = tracks.map(track => {
    // If the track was previously imported but not assigned to Deep, update it
    if (track.spotifyUrl && track.recordLabel && !track.recordLabel.includes('Deep')) {
      return {
        ...track,
        recordLabel: 'Build It Deep'
      };
    }
    return track;
  });

  localStorage.setItem('tracks', JSON.stringify(updatedTracks));
};

export default updateTracks;
