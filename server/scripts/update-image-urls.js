// Script to update all image URLs in the database from via.placeholder.com to placehold.co
const { sequelize, Artist, Release } = require('../models');

async function updateImageUrls() {
  try {
    console.log('Starting image URL update process...');
    
    // Start a transaction to ensure all updates succeed or fail together
    const transaction = await sequelize.transaction();
    
    try {
      // Update artists image URLs
      const artistResult = await sequelize.query(`
        UPDATE "Artists" 
        SET "profile_image_url" = REPLACE("profile_image_url", 'via.placeholder.com', 'placehold.co')
        WHERE "profile_image_url" LIKE '%via.placeholder.com%'
      `, { transaction });
      
      console.log(`Updated ${artistResult[1].rowCount} artist image URLs`);
      
      // Update release artwork URLs
      const releaseResult = await sequelize.query(`
        UPDATE "Releases" 
        SET "artwork_url" = REPLACE("artwork_url", 'via.placeholder.com', 'placehold.co')
        WHERE "artwork_url" LIKE '%via.placeholder.com%'
      `, { transaction });
      
      console.log(`Updated ${releaseResult[1].rowCount} release artwork URLs`);
      
      // Also handle via.placeholder.com/300 format to placehold.co/300x300
      const artistSizeResult = await sequelize.query(`
        UPDATE "Artists" 
        SET "profile_image_url" = 
          CASE 
            WHEN "profile_image_url" LIKE '%via.placeholder.com/300%' THEN 'https://placehold.co/300x300'
            WHEN "profile_image_url" LIKE '%via.placeholder.com/400%' THEN 'https://placehold.co/400x400'
            WHEN "profile_image_url" LIKE '%via.placeholder.com/500%' THEN 'https://placehold.co/500x500'
            ELSE REPLACE("profile_image_url", 'via.placeholder.com', 'placehold.co')
          END
        WHERE "profile_image_url" LIKE '%via.placeholder.com%'
      `, { transaction });
      
      console.log(`Updated ${artistSizeResult[1].rowCount} artist image URLs with size formats`);
      
      // Handle release artwork with size formats
      const releaseSizeResult = await sequelize.query(`
        UPDATE "Releases" 
        SET "artwork_url" = 
          CASE 
            WHEN "artwork_url" LIKE '%via.placeholder.com/300%' THEN 'https://placehold.co/300x300'
            WHEN "artwork_url" LIKE '%via.placeholder.com/400%' THEN 'https://placehold.co/400x400'
            WHEN "artwork_url" LIKE '%via.placeholder.com/500%' THEN 'https://placehold.co/500x500'
            ELSE REPLACE("artwork_url", 'via.placeholder.com', 'placehold.co')
          END
        WHERE "artwork_url" LIKE '%via.placeholder.com%'
      `, { transaction });
      
      console.log(`Updated ${releaseSizeResult[1].rowCount} release artwork URLs with size formats`);
      
      // Set default profile images for artists with missing or empty image URLs
      const missingArtistImagesResult = await sequelize.query(`
        UPDATE "Artists"
        SET "profile_image_url" = 'https://placehold.co/300x300/222/fff?text=Artist'
        WHERE "profile_image_url" IS NULL OR "profile_image_url" = ''
      `, { transaction });
      
      console.log(`Added default images for ${missingArtistImagesResult[1].rowCount} artists with missing images`);
      
      // Set default artwork for releases with missing or empty artwork URLs
      const missingReleaseImagesResult = await sequelize.query(`
        UPDATE "Releases"
        SET "artwork_url" = 'https://placehold.co/500x500/222/fff?text=Release'
        WHERE "artwork_url" IS NULL OR "artwork_url" = ''
      `, { transaction });
      
      console.log(`Added default images for ${missingReleaseImagesResult[1].rowCount} releases with missing images`);
      
      // Commit transaction if everything succeeded
      await transaction.commit();
      console.log('Image URL update process completed successfully!');
    } catch (error) {
      // Rollback transaction if any error occurred
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error updating image URLs:', error);
  } finally {
    // Close the database connection
    await sequelize.close();
  }
}

// Run the script
updateImageUrls();
