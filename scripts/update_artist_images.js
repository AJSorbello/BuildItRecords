const { Artist } = require('../server/models');
const getSpotifyService = require('../server/services/SpotifyService');
require('dotenv').config();

async function updateArtistImages() {
  const spotify = getSpotifyService();
  
  try {
    // Initialize Spotify service
    await spotify.initialize();

    // Get all artists from the database
    const artists = await Artist.findAll({
      where: {
        image_url: null // Only get artists without images
      }
    });

    console.log(`Found ${artists.length} artists without images`);

    // Update each artist's images
    for (const artist of artists) {
      try {
        console.log(`Updating images for artist: ${artist.name} (${artist.id})`);
        const updatedArtist = await spotify.updateArtistImages(artist.id);
        
        if (updatedArtist && updatedArtist.image_url) {
          console.log(`Successfully updated images for ${artist.name}`);
        } else {
          console.log(`No images found for ${artist.name}`);
        }

        // Add a small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error updating artist ${artist.name}:`, error);
        continue; // Continue with next artist even if one fails
      }
    }

    console.log('Finished updating artist images');
  } catch (error) {
    console.error('Error:', error);
  }
}

updateArtistImages().catch(console.error);
