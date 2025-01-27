const { Artist } = require('../server/models');
const getSpotifyService = require('../server/services/SpotifyService');
require('dotenv').config();

async function fixArtistSpotifyIds() {
  const spotify = getSpotifyService();
  
  try {
    await spotify.initialize();

    const artistUpdates = [
      { name: 'Lim Bom', oldId: '3og3v8mHrJVInbLtJSuxXt', newId: '1irUv6mVlOwS1U7HgPlaG3' },
      { name: 'Chic Iverson', oldId: '7rF3f4HuDpSrmox92qbAO6', newId: '1AcOS2SW0jUFMGchGih1Hs' },
      { name: 'Mltd', oldId: '6mVxjfvV0y0deUmJBslnuI', newId: '3Uosz69azEpRy925Ey0GtA' },
      { name: 'YCHTCLB', oldId: '237jViwUtYWobFMMhadK93', newId: '3y2B6r4noWJ8GyOppDkqX7' }
    ];

    for (const update of artistUpdates) {
      try {
        console.log(`Updating ${update.name} with new Spotify ID: ${update.newId}`);
        
        // Find the artist in our database
        const artist = await Artist.findOne({
          where: { id: update.oldId }
        });

        if (!artist) {
          console.log(`Artist ${update.name} not found in database`);
          continue;
        }

        // Get artist data from Spotify
        const spotifyArtist = await spotify.getArtist(update.newId);
        
        if (spotifyArtist && spotifyArtist.images && spotifyArtist.images.length > 0) {
          // Update the artist with new ID and image
          await artist.update({
            id: update.newId,
            spotify_uri: `spotify:artist:${update.newId}`,
            spotify_url: `https://open.spotify.com/artist/${update.newId}`,
            image_url: spotifyArtist.images[0].url,
            images: spotifyArtist.images
          });
          console.log(`Successfully updated ${update.name} with new Spotify data`);
        } else {
          console.log(`No Spotify data found for ${update.name}`);
        }
      } catch (error) {
        console.error(`Error updating ${update.name}:`, error);
      }
    }

    console.log('Finished updating artist Spotify IDs');
  } catch (error) {
    console.error('Error:', error);
  }
}

fixArtistSpotifyIds().catch(console.error);
