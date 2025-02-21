const getSpotifyService = require('../services/spotifyService');

async function checkAlbum() {
  try {
    const spotifyService = await getSpotifyService();
    console.log('Spotify service initialized');

    const albumId = '0YE30GnmPwRruRNnJYAEYL';
    const response = await spotifyService.spotifyApi.getAlbum(albumId);
    
    console.log('Album details:', {
      name: response.body.name,
      label: response.body.label,
      release_date: response.body.release_date,
      type: response.body.album_type,
      total_tracks: response.body.total_tracks
    });

    // Get the first artist's ID
    const artistId = response.body.artists[0].id;
    console.log('Artist ID:', artistId);

    // Get all albums by this artist
    const artistAlbums = await spotifyService.spotifyApi.getArtistAlbums(artistId, {
      limit: 50,
      include_groups: 'album,single,compilation'
    });

    console.log('\nAll releases by this artist:');
    artistAlbums.body.items.forEach(album => {
      console.log({
        name: album.name,
        release_date: album.release_date,
        label: album.label || 'Unknown',
        type: album.album_type
      });
    });

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkAlbum();
