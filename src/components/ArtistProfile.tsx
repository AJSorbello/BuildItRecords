import React from 'react';
import {
  Box,
  Grid,
  Typography,
  CircularProgress,
  Paper,
  Chip,
  Avatar,
  Divider,
} from '@mui/material';
import { useSpotifyArtist } from '../hooks/useSpotifyArtist';
import { ReleaseCard } from './ReleaseCard';

interface ArtistProfileProps {
  artistId: string;
}

export const ArtistProfile: React.FC<ArtistProfileProps> = ({ artistId }) => {
  const { artist, loading, error } = useSpotifyArtist(artistId, {
    includeRelated: true,
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!artist) return null;

  return (
    <Box>
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            {artist.images?.[0] && (
              <Avatar
                src={artist.images[0].url}
                alt={artist.name}
                sx={{ width: '100%', height: 'auto', aspectRatio: '1', mb: 2 }}
                variant="rounded"
              />
            )}
          </Grid>
          <Grid item xs={12} md={8}>
            <Typography variant="h3" gutterBottom>
              {artist.name}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              {artist.followers.total.toLocaleString()} followers
            </Typography>
            <Box sx={{ my: 2 }}>
              {artist.genres.map((genre) => (
                <Chip
                  key={genre}
                  label={genre}
                  sx={{ mr: 1, mb: 1 }}
                  size="small"
                />
              ))}
            </Box>
            <Typography variant="body1" gutterBottom>
              Popularity: {artist.popularity}/100
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {artist.topTracks && artist.topTracks.length > 0 && (
        <Box mb={6}>
          <Typography variant="h5" gutterBottom>
            Top Tracks
          </Typography>
          <Grid container spacing={3}>
            {artist.topTracks.slice(0, 6).map((track) => (
              <Grid item key={track.id} xs={12} sm={6} md={4}>
                <ReleaseCard track={track} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {artist.albums && artist.albums.length > 0 && (
        <Box mb={6}>
          <Typography variant="h5" gutterBottom>
            Albums
          </Typography>
          <Grid container spacing={3}>
            {artist.albums.map((album) => (
              <Grid item key={album.id} xs={12} sm={6} md={4}>
                <ReleaseCard
                  release={{
                    id: album.id,
                    title: album.name,
                    type: album.type,
                    artist: artist.name,
                    artwork: album.images?.[0]?.url,
                    spotifyUrl: album.spotifyUrl,
                  }}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {artist.relatedArtists && artist.relatedArtists.length > 0 && (
        <Box>
          <Typography variant="h5" gutterBottom>
            Related Artists
          </Typography>
          <Grid container spacing={3}>
            {artist.relatedArtists.slice(0, 6).map((relatedArtist) => (
              <Grid item key={relatedArtist.id} xs={12} sm={6} md={4}>
                <ReleaseCard
                  release={{
                    id: relatedArtist.id,
                    title: relatedArtist.name,
                    type: 'artist',
                    artist: relatedArtist.name,
                    artwork: relatedArtist.images?.[0]?.url,
                    spotifyUrl: relatedArtist.spotifyUrl,
                  }}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
};
