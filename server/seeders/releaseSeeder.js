const { Artist, Release, Track } = require('../models');
const SpotifyService = require('../services/spotifyService');

// Define the labels we need for seeding
const RECORD_LABELS = {
  TECH: {
    id: 'tech',
    name: 'Tech',
    displayName: 'Tech House',
    playlistId: process.env.SPOTIFY_TECH_PLAYLIST_ID
  },
  DEEP: {
    id: 'deep',
    name: 'Deep',
    displayName: 'Deep House',
    playlistId: process.env.SPOTIFY_DEEP_PLAYLIST_ID
  },
  RECORDS: {
    id: 'buildit-records',
    name: 'Records',
    displayName: 'Build It Records',
    playlistId: process.env.SPOTIFY_RECORDS_PLAYLIST_ID
  }
};

const seedReleases = async () => {
  try {
    console.log('[Seeder] Seeding releases from Spotify...');

    // Initialize Spotify API
    const spotifyService = new SpotifyService({
      clientId: process.env.REACT_APP_SPOTIFY_CLIENT_ID,
      clientSecret: process.env.REACT_APP_SPOTIFY_CLIENT_SECRET,
      redirectUri: process.env.REACT_APP_SPOTIFY_REDIRECT_URI
    });
    await spotifyService.initialize();

    // Fetch and seed data for each label
    for (const [labelId, labelData] of Object.entries(RECORD_LABELS)) {
      console.log(`[Seeder] Processing label: ${labelData.name}`);
      
      if (!labelData.playlistId) {
        console.log(`[Seeder] No playlist ID configured for label ${labelData.name}, skipping...`);
        continue;
      }

      // Fetch playlist tracks
      const playlistTracks = await spotifyService.fetchPlaylistTracks(labelData.playlistId);
      
      for (const item of playlistTracks) {
        const track = item.track;
        if (!track) continue;

        // Get or create the artist
        const artistData = await spotifyService.fetchArtist(track.artists[0].id);
        const [artist] = await Artist.findOrCreate({
          where: { id: artistData.id },
          defaults: {
            name: artistData.name,
            spotify_url: artistData.external_urls.spotify,
            image_url: artistData.images?.[0]?.url || null,
            label_id: labelId
          }
        });

        // Get or create the release (album)
        const albumData = await spotifyService.fetchAlbum(track.album.id);
        const [release] = await Release.findOrCreate({
          where: { id: albumData.id },
          defaults: {
            title: albumData.name,
            release_date: new Date(albumData.release_date),
            type: albumData.album_type,
            status: 'published',
            spotify_url: albumData.external_urls.spotify,
            image_url: albumData.images?.[0]?.url || null,
            label_id: labelId,
            primary_artist_id: artist.id
          }
        });

        // Create the track
        await Track.findOrCreate({
          where: { id: track.id },
          defaults: {
            name: track.name,
            duration: track.duration_ms,
            track_number: track.track_number,
            disc_number: track.disc_number,
            isrc: track.external_ids?.isrc,
            preview_url: track.preview_url,
            spotify_url: track.external_urls.spotify,
            release_id: release.id,
            label_id: labelId
          }
        });

        // Create track-artist associations
        await track.artists.forEach(async (artistData) => {
          const [trackArtist] = await Artist.findOrCreate({
            where: { id: artistData.id },
            defaults: {
              name: artistData.name,
              spotify_url: artistData.external_urls.spotify,
              label_id: labelId
            }
          });
          await release.addArtist(trackArtist);
        });
      }
    }

    console.log('[Seeder] Releases, artists, and tracks seeded successfully from Spotify');
  } catch (error) {
    console.error('[Seeder] Error seeding releases:', error);
    throw error;
  }
};

module.exports = { seedReleases };
