import React from 'react';
import { Box, Typography, Grid, Card, CardMedia, styled } from '@mui/material';

interface Track {
  id: string;
  trackTitle: string;
  artist: string;
  albumCover: string;
  recordLabel: string;
}

const TrackCard = styled(Card)({
  display: 'flex',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    transform: 'scale(1.02)',
  },
});

const TrackList: React.FC<{ tracks: Track[] }> = ({ tracks }) => {
  return (
    <Box sx={{ width: '100%' }}>
      <Grid container spacing={2}>
        {tracks.map((track) => (
          <Grid item xs={12} key={track.id}>
            <TrackCard>
              <CardMedia
                component="img"
                sx={{ width: 60, height: 60 }}
                image={track.albumCover}
                alt={`${track.trackTitle} cover`}
              />
              <Box sx={{ display: 'flex', flexGrow: 1, alignItems: 'center', px: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 3 }}>
                  <Typography 
                    variant="subtitle1" 
                    component="div" 
                    sx={{ 
                      color: 'text.primary',
                      width: '200px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {track.artist}
                  </Typography>
                  <Typography 
                    variant="subtitle1" 
                    component="div" 
                    sx={{ 
                      color: 'text.primary',
                      width: '250px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {track.trackTitle}
                  </Typography>
                  <Typography 
                    variant="subtitle1" 
                    component="div" 
                    sx={{ 
                      color: 'text.secondary',
                      flexGrow: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {track.recordLabel}
                  </Typography>
                </Box>
              </Box>
            </TrackCard>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default TrackList;
