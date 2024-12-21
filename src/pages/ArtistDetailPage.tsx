import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Container, Grid, Card, CardMedia, CardContent, IconButton } from '@mui/material';
import { Artist } from '../types/artist';
import { Track } from '../types/track';
import { spotifyService } from '../services/SpotifyService';
import { databaseService } from '../services/DatabaseService';
import { LoadingSpinner } from '../components';
import { ErrorMessage } from '../components';
import { convertSpotifyArtistToArtist } from '../utils/spotifyUtils';
import { RECORD_LABELS } from '../constants/labels';
import { useTheme } from '../contexts/ThemeContext';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';

interface ArtistDetailPageProps {
  artistId?: string;
}

const ArtistDetailPage: React.FC<ArtistDetailPageProps> = () => {
  const { artistName } = useParams<{ artistName: string }>();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const { colors } = useTheme();

  useEffect(() => {
    const fetchArtistDetails = async () => {
      try {
        if (!artistName) {
          setError('Artist name is required');
          return;
        }

        const spotifyArtist = await spotifyService.getArtistDetailsByName(artistName);
        if (!spotifyArtist) {
          setError('Artist not found');
          return;
        }

        const convertedArtist = convertSpotifyArtistToArtist(spotifyArtist, RECORD_LABELS['Build It Records']);
        setArtist(convertedArtist);

        const artistTracks = await spotifyService.getArtistTracks(spotifyArtist.id);
        setTracks(artistTracks);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchArtistDetails();
  }, [artistName]);

  const handlePlayTrack = (track: Track) => {
    if (playingTrackId === track.id) {
      setPlayingTrackId(null);
    } else {
      setPlayingTrackId(track.id);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!artist) {
    return <ErrorMessage message="Artist not found" />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Card sx={{ backgroundColor: colors.card, borderRadius: 2 }}>
              <CardMedia
                component="img"
                height="300"
                image={artist.imageUrl || artist.images?.[0]?.url || 'https://via.placeholder.com/300x300?text=No+Image'}
                alt={artist.name}
                sx={{ objectFit: 'cover' }}
              />
            </Card>
          </Grid>
          <Grid item xs={12} md={8}>
            <Typography variant="h3" component="h1" sx={{ mb: 2, color: colors.text }}>
              {artist.name}
            </Typography>
            {artist.genres && artist.genres.length > 0 && (
              <Typography variant="h6" sx={{ mb: 2, color: colors.textSecondary }}>
                {artist.genres.join(', ')}
              </Typography>
            )}
            {artist.bio && (
              <Typography variant="body1" sx={{ mb: 3, color: colors.text }}>
                {artist.bio}
              </Typography>
            )}
            {artist.followers && (
              <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                {artist.followers.toLocaleString()} followers
              </Typography>
            )}
          </Grid>
        </Grid>
      </Box>

      <Typography variant="h4" sx={{ mb: 3, color: colors.text }}>
        Top Tracks
      </Typography>
      <Grid container spacing={3}>
        {tracks.map((track) => (
          <Grid item xs={12} sm={6} md={4} key={track.id}>
            <Card sx={{ backgroundColor: colors.card, borderRadius: 2 }}>
              <CardMedia
                component="img"
                height="200"
                image={track.albumCover || track.imageUrl || track.album?.images[0]?.url}
                alt={track.name}
                sx={{ objectFit: 'cover' }}
              />
              <CardContent>
                <Typography variant="h6" component="div" sx={{ color: colors.text }}>
                  {track.name}
                </Typography>
                {track.preview_url && (
                  <IconButton 
                    onClick={() => handlePlayTrack(track)}
                    sx={{ color: colors.text }}
                  >
                    {playingTrackId === track.id ? <PauseIcon /> : <PlayArrowIcon />}
                  </IconButton>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default ArtistDetailPage;
