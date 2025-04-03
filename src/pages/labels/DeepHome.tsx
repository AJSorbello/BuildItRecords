import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { getTracksByLabel } from '../../utils/trackUtils';
import { Track } from '../../types/track';
import TrackList from '../../components/TrackList';
import PageLayout from '../../components/PageLayout';

const DeepHome = () => {
  const [latestTracks, setLatestTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        setLoading(true);
        const tracks = await getTracksByLabel('buildit-deep');
        if (tracks && tracks.length > 0) {
          const sortedTracks = tracks.sort((a, b) => {
            const dateA = a.releaseDate ? new Date(a.releaseDate).getTime() : 0;
            const dateB = b.releaseDate ? new Date(b.releaseDate).getTime() : 0;
            return dateB - dateA;
          });
          setLatestTracks(sortedTracks.slice(0, 10)); // Get the 10 most recent tracks
        } else {
          setLatestTracks([]);
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching tracks:', err);
        setError('Failed to load tracks');
        setLatestTracks([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTracks();
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
            color: '#8E44AD', // Purple color to match Deep's theme
            mb: 4,
            fontWeight: 'bold',
            textAlign: 'center'
          }}
        >
          Build It Deep
        </Typography>

        <Typography 
          variant="h6" 
          component="p" 
          gutterBottom 
          sx={{ 
            color: '#B3B3B3',
            mb: 4,
            textAlign: 'center',
            maxWidth: '800px',
            lineHeight: 1.8
          }}
        >
          Build It Deep embodies the soulful essence of electronic music, curating a meticulously crafted collection of Afro house, deep house, melodic house, and melodic progressive sounds. Our releases transport listeners through hypnotic rhythms, ethereal atmospheres, and emotive melodies that resonate long after the music stops—creating transformative sonic journeys designed for both introspective listening and transcendent dancefloor moments.
        </Typography>

        <Box sx={{ width: '100%', mt: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ color: '#FFFFFF', mb: 3 }}>
            Latest Releases
          </Typography>
          <TrackList 
            tracks={latestTracks}
            loading={loading}
            error={error}
          />
        </Box>
      </Box>
    </PageLayout>
  );
};

export default DeepHome;
