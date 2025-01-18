-- Migrate data from profile_image to image_url if image_url is null
UPDATE artists 
SET image_url = profile_image 
WHERE image_url IS NULL AND profile_image IS NOT NULL;

-- Drop the profile_image column since we're using image_url
ALTER TABLE artists DROP COLUMN profile_image;
