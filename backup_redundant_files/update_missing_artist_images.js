const { Artist, Release } = require('../server/models');
const { Op } = require('sequelize');
require('dotenv').config();

async function updateMissingArtistImages() {
  try {
    // Get all artists without images
    const artists = await Artist.findAll({
      where: {
        [Op.or]: [
          { image_url: null },
          { image_url: '' }
        ]
      },
      include: [{
        model: Release,
        as: 'releases',
        attributes: ['name', 'artwork_url', 'release_date']
      }]
    });

    console.log(`Found ${artists.length} artists without images`);

    for (const artist of artists) {
      try {
        // Get the most recent release for this artist
        if (artist.releases && artist.releases.length > 0) {
          // Sort releases by date (most recent first)
          const sortedReleases = artist.releases.sort((a, b) => 
            new Date(b.release_date) - new Date(a.release_date)
          );

          const latestRelease = sortedReleases[0];
          if (latestRelease && latestRelease.artwork_url) {
            // Update artist with release artwork
            await artist.update({
              image_url: latestRelease.artwork_url,
              images: [{
                url: latestRelease.artwork_url,
                height: 640,
                width: 640
              }]
            });
            console.log(`Updated ${artist.name} with artwork from release: ${latestRelease.name}`);
          } else {
            console.log(`No release artwork found for ${artist.name}`);
          }
        } else {
          console.log(`No releases found for ${artist.name}`);
        }
      } catch (error) {
        console.error(`Error updating artist ${artist.name}:`, error);
      }
    }

    console.log('Finished updating artist images');
  } catch (error) {
    console.error('Error:', error);
  }
}

updateMissingArtistImages().catch(console.error);
