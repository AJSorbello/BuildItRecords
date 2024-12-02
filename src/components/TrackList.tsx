import React from 'react';
import { Box, Typography, Grid, Card, CardContent, CardMedia, Link } from '@mui/material';
import { FaSpotify } from 'react-icons/fa';
import { Track } from '../types/track';
import { getSpotifyAlbumArt } from '../utils/trackUtils';

interface TrackListProps {
  tracks: Track[];
}

const TrackList: React.FC<TrackListProps> = ({ tracks }) => {
  if (!tracks || tracks.length === 0) {
    return (
      <Box sx={{ width: '100%', textAlign: 'center', py: 4 }}>
        <Typography variant="body1" sx={{ color: '#AAAAAA' }}>
          No tracks available
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={4}>
      {tracks.map((track) => (
        <Grid item xs={12} sm={6} md={4} key={track.id}>
          <Card sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              transform: 'scale(1.02)',
            },
            transition: 'all 0.2s ease-in-out'
          }}>
            <CardMedia
              component="img"
              height="200"
              image={getSpotifyAlbumArt(track.spotifyUrl)}
              alt={track.trackTitle}
              sx={{
                objectFit: 'cover',
                transition: 'transform 0.2s ease-in-out',
                '&:hover': {
                  transform: 'scale(1.05)'
                }
              }}
            />
            <CardContent>
              <Typography variant="h6" component="div" sx={{ color: '#FFFFFF' }}>
                {track.trackTitle}
              </Typography>
              <Typography variant="subtitle1" sx={{ color: '#AAAAAA' }}>
                {track.artist}
              </Typography>
              <Typography variant="body2" sx={{ color: '#888888', mb: 2 }}>
                {track.recordLabel}
              </Typography>
              <Box>
                <Link 
                  href={track.spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    color: '#FFFFFF',
                    '&:hover': {
                      color: '#02FF95'
                    }
                  }}
                >
                  <FaSpotify size={24} />
                </Link>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default TrackList;
