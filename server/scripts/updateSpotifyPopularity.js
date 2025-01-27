require('dotenv').config();
const { Sequelize } = require('sequelize');
const db = require('../models');
const SpotifyWebApi = require('spotify-web-api-node');

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET
});

async function updateTrackPopularity() {
  try {
    // Get Spotify access token
    const data = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(data.body['access_token']);

    // Get all tracks with Spotify URIs
    const tracks = await db.Track.findAll({
      where: {
        spotify_uri: {
          [Sequelize.Op.ne]: null
        }
      }
    });

    console.log(`Found ${tracks.length} tracks with Spotify URIs`);

    // Update tracks in batches of 50 (Spotify API limit)
    for (let i = 0; i < tracks.length; i += 50) {
      const batch = tracks.slice(i, i + 50);
      const trackIds = batch.map(track => track.spotify_uri.split(':')[2]);
      
      console.log(`Processing batch ${i/50 + 1} of ${Math.ceil(tracks.length/50)}`);
      
      const response = await spotifyApi.getTracks(trackIds);
      const spotifyTracks = response.body.tracks;

      // Update each track's popularity
      for (let j = 0; j < batch.length; j++) {
        const track = batch[j];
        const spotifyTrack = spotifyTracks[j];
        
        if (spotifyTrack && typeof spotifyTrack.popularity === 'number') {
          await track.update({
            popularity: spotifyTrack.popularity
          });
          console.log(`Updated popularity for track: ${track.name} (${spotifyTrack.popularity})`);
        }
      }

      // Wait a bit between batches to avoid rate limiting
      if (i + 50 < tracks.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log('Finished updating track popularity');
    process.exit(0);
  } catch (error) {
    console.error('Error updating track popularity:', error);
    process.exit(1);
  }
}

updateTrackPopularity();
