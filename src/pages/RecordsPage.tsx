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

const RecordsPage = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);

  useEffect(() => {
    const recordsTracks = getTracksByLabel(RECORD_LABELS.RECORDS);
    const recordsArtists = getArtistsByLabel(RECORD_LABELS.RECORDS);

    console.log('Tracks:', recordsTracks); // Debug log
    console.log('Artists:', recordsArtists); // Debug log

    setTracks(recordsTracks);
    setArtists(recordsArtists);
  }, []);

  return (
    <PageLayout label="records">
      <Box sx={{
        width: '100%',
        // Removed global padding. We'll apply padding to specific elements
      }}>
          {/* Add padding left and top to Typography heading */}
        <Typography variant="h4" component="h1" gutterBottom sx={{
          color: '#FFFFFF',
          mb: 4,
          pl: 3, // Add padding left to only heading
          pt: 2 // Add padding top to heading
        }}>
          Records Releases
        </Typography>

          {/* Move padding to the container box */}
        <Box mb={6} sx={{ pl: 3 }}>
          <Typography variant="h5" gutterBottom sx={{ color: '#FFFFFF', mb: 3 }}>
            Latest Releases
          </Typography>
          <TrackList tracks={tracks} />
        </Box>

        {/* Move padding to the container box, including bottom padding */}
        <Box sx={{ pl: 3, pb: 3 }}>
          <Typography variant="h5" gutterBottom sx={{ color: '#FFFFFF', mb: 4 }}>
            Artists
          </Typography>
          <Grid container spacing={3}>
            {artists.map((artist, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
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

export default RecordsPage;