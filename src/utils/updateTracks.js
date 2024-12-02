// Get current tracks from localStorage
const tracks = JSON.parse(localStorage.getItem('tracks') || '[]');

// Update tracks that should be under Build It Deep
const updatedTracks = tracks.map(track => {
  // If the track was previously imported but not assigned to Deep, update it
  if (track.spotifyUrl && !track.recordLabel.includes('Deep')) {
    return {
      ...track,
      recordLabel: 'Build It Deep'
    };
  }
  return track;
});

// Save updated tracks back to localStorage
localStorage.setItem('tracks', JSON.stringify(updatedTracks));

console.log('Updated tracks:', updatedTracks);
