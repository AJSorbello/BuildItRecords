import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Grid,
  Box,
  CircularProgress,
} from '@mui/material';
import { Track } from '../types/track';
import { Release } from '../types/release';
import { Artist } from '../types/artist';
import { databaseService } from '../services/DatabaseService';
import { FeaturedRelease } from '../components/FeaturedRelease';
import { ReleaseCard } from '../components/ReleaseCard';
import { useNavigate } from 'react-router-dom';

const HomePage: React.FC = () => {
  const [featuredTrack, setFeaturedTrack] = useState<Track | null>(null);
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Get recent tracks for the records label
        const response = await databaseService.getTracksByLabel('records');
        if (response.tracks.length > 0) {
          // Set the first track as featured
          setFeaturedTrack(response.tracks[0]);
          // Set the rest as recent tracks (up to 6)
          setRecentTracks(response.tracks.slice(1, 7));
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load content');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleTrackClick = (track: Track) => {
    if (track.artists?.[0]?.id) {
      navigate(`/artists/${track.artists[0].id}`);
    }
  };

  const convertTrackToRelease = (track: Track): Release => {
    return {
      id: track.id,
      title: track.title,
      artists: track.artists || [],
      images: track.release?.images || [],
      artwork_url: track.release?.artwork_url,
      release_date: new Date().toISOString(),
      external_urls: { spotify: track.external_urls?.spotify || '' },
      uri: track.spotify_uri || '',
      tracks: [track],
      total_tracks: 1,
      type: 'single',
      status: 'active'
    };
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container>
        <Typography color="error" align="center">
          {error}
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {featuredTrack && (
        <Box sx={{ mb: 6 }}>
          <Typography variant="h4" gutterBottom>
            Featured Release
          </Typography>
          <FeaturedRelease track={featuredTrack} />
        </Box>
      )}

      {recentTracks.length > 0 && (
        <Box>
          <Typography variant="h4" gutterBottom>
            Recent Releases
          </Typography>
          <Grid container spacing={3}>
            {recentTracks.map((track) => (
              <Grid item key={track.id} xs={12} sm={6} md={4}>
                <ReleaseCard 
                  release={convertTrackToRelease(track)}
                  onClick={() => handleTrackClick(track)}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Container>
  );
};

export default HomePage;
