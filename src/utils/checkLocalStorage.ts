interface Track {
  id: string;
  name: string;
  spotifyUrl?: string;
  recordLabel?: string;
}

// Utility function to log the contents of localStorage for tracks
(function checkLocalStorage(): void {
  const tracksJson = localStorage.getItem('tracks');
  if (!tracksJson) {
    console.log('No tracks found in localStorage');
    return;
  }

  try {
    const tracks: Track[] = JSON.parse(tracksJson);
    console.log('Tracks in localStorage:', tracks);
  } catch (error) {
    console.error('Error parsing tracks from localStorage:', error);
  }
})();
