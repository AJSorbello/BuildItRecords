import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Grid, CircularProgress, Alert } from '@mui/material';
import { useSpotifyPlaylists } from '../../hooks/useSpotifyPlaylists';
import ReleaseCard from '../../components/ReleaseCard';
import { RECORD_LABELS } from '../../constants/labels';
import { SpotifyArtist, convertSpotifyArtist, isTrack } from '../../types';
import type { Release, Track } from '../../types';
import { getTrackImage, getArtistNames, sortTracksByDate, transformArtists } from '../../utils/trackUtils';

const TechHome: React.FC = () => {
  const [releases, setReleases] = useState<Release[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const { tracks, loading, error: playlistError } = useSpotifyPlaylists(
    RECORD_LABELS.TECH.playlistId || ''
  );

  useEffect(() => {
    if (playlistError) {
      setError(new Error(playlistError.message));
      return;
    }

    if (!loading && tracks.length > 0) {
      try {
        const sortedTracks = sortTracksByDate(tracks);
        const latestReleases: Release[] = sortedTracks
          .filter(isTrack)
          .map(track => {
            const artists = transformArtists(track.artists as SpotifyArtist[]);
            const mainArtist = artists[0];

            const release: Release = {
              id: track.id,
              title: track.name,
              artist: mainArtist,
              primaryArtist: mainArtist,
              artists,
              releaseDate: track.releaseDate || track.album?.release_date || '',
              artworkUrl: getTrackImage(track),
              spotifyUrl: track.external_urls.spotify,
              tracks: [track],
              label: RECORD_LABELS.TECH,
              images: track.images || track.album?.images || [],
              external_urls: track.external_urls,
              uri: track.uri,
              type: 'release'
            };

            return release;
          });

        setReleases(latestReleases);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to process tracks'));
      }
    }
  }, [tracks, loading, playlistError]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Alert severity="error">
          {error instanceof Error ? error.message : 'An unknown error occurred'}
        </Alert>
      </Box>
    );
  }

  if (!releases.length) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Alert severity="info">No releases found</Alert>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {RECORD_LABELS.TECH.displayName}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Latest Releases
        </Typography>

        <Grid container spacing={3}>
          {releases.map((release, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={release.id}>
              <ReleaseCard
                release={release}
                featured={index === 0}
              />
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
};

export default TechHome;
