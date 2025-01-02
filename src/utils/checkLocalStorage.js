// Utility function to log the contents of localStorage for tracks
(function checkLocalStorage() {
  const tracksJson = localStorage.getItem('tracks');
  if (!tracksJson) {
    console.log('No tracks found in localStorage');
    return;
  }

  const tracks = JSON.parse(tracksJson);
  console.log('Tracks in localStorage:', tracks);
})();
