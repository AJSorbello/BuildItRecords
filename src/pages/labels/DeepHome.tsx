import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { RECORD_LABELS } from '../../constants/labels';
import { getTracksByLabel } from '../../utils/trackUtils';
import { Track } from '../../types/track';
import TrackList from '../../components/TrackList';
import PageLayout from '../../components/PageLayout';

const DeepHome = () => {
  const [latestTrack, setLatestTrack] = useState<Track[]>([]);

  useEffect(() => {
    const tracks = getTracksByLabel(RECORD_LABELS.DEEP);
    // Sort tracks by release date and get the latest one
    const sortedTracks = tracks.sort((a, b) => 
      new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
    );
    setLatestTrack(sortedTracks.slice(0, 1)); // Get only the first track
  }, []);

  return (
    <PageLayout label="deep">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          maxWidth: '900px',
          mx: 'auto',
          mt: 2,
          px: 2
        }}
      >
        <Typography 
          variant="h3" 
          component="h1" 
          gutterBottom 
          sx={{ 
            color: '#FFFFFF',
            mb: 4,
            fontWeight: 'bold',
            textAlign: 'center'
          }}
        >
          Build It Deep
        </Typography>
        
        <Typography 
          variant="h5" 
          sx={{ 
            color: '#AAAAAA',
            mb: 6,
            textAlign: 'center'
          }}
        >
          Exploring the depths of deep house and melodic techno.
        </Typography>

        <Typography 
          variant="h4" 
          gutterBottom 
          sx={{ 
            color: '#FFFFFF',
            mb: 4,
            fontWeight: 'bold'
          }}
        >
          Latest Release
        </Typography>

        <TrackList tracks={latestTrack} />
      </Box>
    </PageLayout>
  );
};

export default DeepHome;
