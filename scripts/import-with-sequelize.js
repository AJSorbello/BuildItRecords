/**
 * BuildIt Records Spotify Import Script (Using Sequelize)
 * 
 * This script uses your existing application models to import data from Spotify
 */

require('dotenv').config({ path: '.env.supabase' });
const SpotifyWebApi = require('spotify-web-api-node');
const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

// Load models 
const models = require('../server/models');
const { Artist, Release, Track, Label, TrackArtist, ReleaseArtist } = models;

// Configure Spotify API
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

// Label mappings (BuildIt Records has multiple formats in Spotify)
const LABEL_MAPPINGS = {
  'Build It Records': ['buildit-records', '1'],
  'BuildIt Records': ['buildit-records', '1'],
  'Build It Tech': ['buildit-tech', '2'],
  'BuildIt Tech': ['buildit-tech', '2'],
  'Build It Deep': ['buildit-deep', '3'],
  'BuildIt Deep': ['buildit-deep', '3'],
};

// Get spotify access token
async function getSpotifyToken() {
  try {
    const data = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(data.body.access_token);
    console.log('Spotify access token acquired');
    return data.body.access_token;
  } catch (error) {
    console.error('Error getting Spotify access token:', error.message);
    throw error;
  }
}

// Search for all albums by a label
async function searchReleasesByLabel(labelName) {
  console.log(`Searching for releases by label: ${labelName}`);
  
  const releases = [];
  let offset = 0;
  const limit = 50; // Spotify's maximum limit
  let hasMore = true;
  let totalAlbums = 0;

  while (hasMore) {
    try {
      // Use exact label match with quotes
      const searchQuery = `label:"${labelName}"`;
      const result = await spotifyApi.searchAlbums(searchQuery, { limit, offset });
      
      if (!result.body.albums || !result.body.albums.items || result.body.albums.items.length === 0) {
        console.log(`No more albums found for label: ${labelName} at offset ${offset}`);
        hasMore = false;
        continue;
      }

      const albums = result.body.albums.items;
      console.log(`Fetched ${albums.length} albums at offset ${offset}`);
      
      // Update total on first request
      if (offset === 0) {
        totalAlbums = result.body.albums.total;
        console.log(`Total albums for label ${labelName}: ${totalAlbums}`);
      }

      // Get detailed album info for each result
      for (const album of albums) {
        try {
          const albumDetails = await spotifyApi.getAlbum(album.id);
          releases.push(albumDetails.body);
          
          // Add a small delay to prevent hitting rate limits
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Error fetching details for album ${album.id}:`, error.message);
        }
      }

      offset += albums.length;
      hasMore = offset < totalAlbums;

      // Add delay between batches
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`Error searching albums for label ${labelName}:`, error.message);
      
      // If rate limited, wait and try again
      if (error.statusCode === 429 && error.headers && error.headers['retry-after']) {
        const retryAfter = parseInt(error.headers['retry-after'], 10) * 1000;
        console.log(`Rate limited, waiting ${retryAfter/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, retryAfter));
      } else {
        // For other errors, break the loop
        hasMore = false;
      }
    }
  }

  return releases;
}

// Save releases to database using Sequelize models
async function saveReleasesToDatabase(releases, labelSlug, labelId) {
  console.log(`\n========== IMPORTING ${releases.length} RELEASES FOR ${labelSlug} ==========\n`);
  
  try {
    // Find label 
    const label = await Label.findOne({
      where: { id: labelId }
    });
    
    if (!label) {
      throw new Error(`Label not found with ID: ${labelId}`);
    }
    
    // Track progress
    let releaseCount = 0;
    let artistCount = 0;
    let trackCount = 0;
    let existingReleaseCount = 0;
    
    for (const release of releases) {
      try {
        releaseCount++;
        console.log(`\n[${releaseCount}/${releases.length}] Processing release: ${release.name} (${release.id})`);
        
        // Try to find existing release by spotify_id
        let existingRelease = await Release.findOne({
          where: { spotify_id: release.id }
        });
        
        let releaseRecord;
        
        if (!existingRelease) {
          // Create new release
          releaseRecord = await Release.create({
            spotify_id: release.id,
            title: release.name,
            release_type: release.album_type || 'album',
            release_date: release.release_date || new Date().toISOString().split('T')[0],
            artwork_url: release.images && release.images.length > 0 ? release.images[0].url : null,
            spotify_url: release.external_urls?.spotify,
            label_id: labelId,
            images: release.images || [],
            total_tracks: release.total_tracks || 0,
            status: 'published'
          });
          
          console.log(`  Created new release: ${release.name} (${releaseRecord.id})`);
        } else {
          existingReleaseCount++;
          releaseRecord = existingRelease;
          console.log(`  Release already exists: ${release.name} (${releaseRecord.id})`);
          
          // Update existing release
          await existingRelease.update({
            title: release.name,
            release_type: release.album_type || 'album',
            release_date: release.release_date || new Date().toISOString().split('T')[0],
            artwork_url: release.images && release.images.length > 0 ? release.images[0].url : null,
            spotify_url: release.external_urls?.spotify,
            label_id: labelId,
            images: release.images || [],
            total_tracks: release.total_tracks || 0
          });
        }
        
        // Process artists for this release
        console.log(`  Processing ${release.artists.length} artists for release "${release.name}"`);
        for (const artist of release.artists) {
          // Find or create artist
          let artistRecord;
          const [existingArtist, created] = await Artist.findOrCreate({
            where: { spotify_id: artist.id },
            defaults: {
              name: artist.name,
              spotify_id: artist.id,
              spotify_url: artist.external_urls?.spotify,
              label_id: labelId
            }
          });
          
          artistRecord = existingArtist;
          
          if (created) {
            artistCount++;
            console.log(`    Created new artist: ${artist.name}`);
            
            // Try to get more artist details from Spotify
            try {
              const artistDetails = await spotifyApi.getArtist(artist.id);
              await artistRecord.update({
                profile_image_url: artistDetails.body.images?.[0]?.url,
                images: artistDetails.body.images || []
              });
            } catch (error) {
              console.error(`    Could not get details for artist ${artist.name}:`, error.message);
            }
          } else {
            console.log(`    Artist already exists: ${artist.name}`);
          }
          
          // Create release-artist association
          await ReleaseArtist.findOrCreate({
            where: {
              release_id: releaseRecord.id,
              artist_id: artistRecord.id
            },
            defaults: {
              release_id: releaseRecord.id,
              artist_id: artistRecord.id
            }
          });
        }
        
        // Process tracks for this release
        if (release.tracks && release.tracks.items) {
          console.log(`  Processing ${release.tracks.items.length} tracks for release "${release.name}"`);
          for (const track of release.tracks.items) {
            try {
              // Find or create track
              let trackRecord;
              const [existingTrack, created] = await Track.findOrCreate({
                where: { spotify_id: track.id },
                defaults: {
                  title: track.name,
                  spotify_id: track.id,
                  duration_ms: track.duration_ms,
                  track_number: track.track_number,
                  disc_number: track.disc_number || 1,
                  preview_url: track.preview_url,
                  spotify_url: track.external_urls?.spotify,
                  release_id: releaseRecord.id
                }
              });
              
              trackRecord = existingTrack;
              
              if (created) {
                trackCount++;
                console.log(`    Created track: ${track.name}`);
              } else {
                console.log(`    Track already exists: ${track.name}`);
                
                // Update existing track
                await trackRecord.update({
                  title: track.name,
                  duration_ms: track.duration_ms,
                  track_number: track.track_number,
                  disc_number: track.disc_number || 1,
                  preview_url: track.preview_url,
                  spotify_url: track.external_urls?.spotify,
                  release_id: releaseRecord.id
                });
              }
              
              // Process track artists
              for (const artist of track.artists) {
                // Find or create artist (similar to above)
                let artistRecord;
                const [existingArtist, created] = await Artist.findOrCreate({
                  where: { spotify_id: artist.id },
                  defaults: {
                    name: artist.name,
                    spotify_id: artist.id,
                    spotify_url: artist.external_urls?.spotify,
                    label_id: labelId
                  }
                });
                
                artistRecord = existingArtist;
                
                // Create track-artist association
                await TrackArtist.findOrCreate({
                  where: {
                    track_id: trackRecord.id,
                    artist_id: artistRecord.id
                  },
                  defaults: {
                    track_id: trackRecord.id,
                    artist_id: artistRecord.id
                  }
                });
              }
            } catch (error) {
              console.error(`    Error processing track ${track.name}:`, error.message);
            }
          }
        }
        
      } catch (releaseError) {
        console.error(`Error processing release ${release.name}:`, releaseError.message);
        // Continue with next release
      }
    }
    
    console.log(`\n========== IMPORT SUMMARY FOR ${labelSlug} ==========`);
    console.log(`Total releases processed: ${releaseCount}`);
    console.log(`New releases added: ${releaseCount - existingReleaseCount}`);
    console.log(`Existing releases updated: ${existingReleaseCount}`);
    console.log(`New artists added: ${artistCount}`);
    console.log(`New tracks added: ${trackCount}`);
    console.log(`================================================\n`);
    
    return { 
      success: true, 
      count: releases.length,
      stats: {
        releases: releaseCount,
        newReleases: releaseCount - existingReleaseCount,
        existingReleases: existingReleaseCount,
        newArtists: artistCount,
        newTracks: trackCount
      }
    };
  } catch (error) {
    console.error('Error saving releases to database:', error.message);
    throw error;
  }
}

// Main function
async function main() {
  try {
    // Get Spotify access token
    await getSpotifyToken();
    
    // Process each label
    for (const [labelName, [labelSlug, labelId]] of Object.entries(LABEL_MAPPINGS)) {
      console.log(`Processing label: ${labelName} (${labelSlug}, ID: ${labelId})`);
      
      // Search for releases
      const releases = await searchReleasesByLabel(labelName);
      console.log(`Found ${releases.length} releases for label ${labelName}`);
      
      // Save releases to database
      await saveReleasesToDatabase(releases, labelSlug, labelId);
    }
    
    console.log('Import completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Import failed:', error.message);
    process.exit(1);
  }
}

// Run the script
main();
