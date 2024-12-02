import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, CardMedia, Link, styled } from '@mui/material';
import { FaSpotify, FaSoundcloud } from 'react-icons/fa';
import { SiBeatport } from 'react-icons/si';
import PageLayout from '../components/PageLayout';
import { Track } from '../types/track';
import { getTracksByLabel } from '../utils/trackUtils';
import { RECORD_LABELS } from '../constants/labels';
import { getArtistsByLabel } from '../utils/artistUtils';
import { Artist } from '../data/mockData';
import TrackList from '../components/TrackList';

const IconLink = styled(Link)({
  color: '#FFFFFF',
  marginRight: '16px',
  '&:hover': {
    color: '#02FF95',
  },
});

const ArtistCard = styled(Card)({
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  transition: 'transform 0.2s',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  '&:hover': {
    transform: 'scale(1.02)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
});

const DeepPage = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);

  useEffect(() => {
    setTracks(getTracksByLabel(RECORD_LABELS.DEEP));
    setArtists(getArtistsByLabel(RECORD_LABELS.DEEP));
  }, []);

  return (
    <PageLayout label="deep">
      <Box sx={{ maxWidth: 1200, margin: '0 auto', padding: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#FFFFFF', mb: 4 }}>
          Deep Releases
        </Typography>
        
        <Box mb={6}>
          <TrackList tracks={tracks} />
        </Box>

        <Box>
          <Typography variant="h5" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
            Artists
          </Typography>
          <Grid container spacing={3} justifyContent="center">
            {artists.map((artist) => (
              <Grid item xs={12} sm={6} md={4} key={artist.id}>
                <ArtistCard>
                  <CardMedia
                    component="img"
                    height="200"
                    image={artist.imageUrl || 'https://via.placeholder.com/300x300.png?text=' + encodeURIComponent(artist.name)}
                    alt={artist.name}
                    sx={{
                      objectFit: 'cover',
                      transition: 'transform 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'scale(1.05)'
                      }
                    }}
                  />
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ color: '#FFFFFF' }}>
                      {artist.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#AAAAAA', mb: 2 }}>
                      {artist.bio}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <IconLink href={artist.spotifyUrl} target="_blank" rel="noopener noreferrer">
                        <FaSpotify size={24} />
                      </IconLink>
                      <IconLink href={artist.beatportUrl} target="_blank" rel="noopener noreferrer">
                        <SiBeatport size={24} />
                      </IconLink>
                      <IconLink href={artist.soundcloudUrl} target="_blank" rel="noopener noreferrer">
                        <FaSoundcloud size={24} />
                      </IconLink>
                    </Box>
                  </CardContent>
                </ArtistCard>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>
    </PageLayout>
  );
};

export default DeepPage;
