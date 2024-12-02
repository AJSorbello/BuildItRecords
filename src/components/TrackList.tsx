import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, CardMedia, Link, CircularProgress } from '@mui/material';
import { FaSpotify } from 'react-icons/fa';
import { Track } from '../types/track';
import { fetchTrackDetails } from '../utils/spotifyUtils';
import { SpotifyTrack } from '../types/spotify';

interface TrackListProps {
  tracks: Track[];
}

const TrackList: React.FC<TrackListProps> = ({ tracks }) => {
  const [trackDetails, setTrackDetails] = useState<Record<string, SpotifyTrack>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchAllTrackDetails = async () => {
      for (const track of tracks) {
        if (!trackDetails[track.id] && !loading[track.id]) {
          setLoading(prev => ({ ...prev, [track.id]: true }));
          try {
            const details = await fetchTrackDetails(track.spotifyUrl);
            setTrackDetails(prev => ({ ...prev, [track.id]: details }));
          } catch (error) {
            console.error(`Error fetching details for track ${track.id}:`, error);
          } finally {
            setLoading(prev => ({ ...prev, [track.id]: false }));
          }
        }
      }
    };

    fetchAllTrackDetails();
  }, [tracks]);

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
            <Box sx={{ position: 'relative', paddingTop: '100%' }}>
              {loading[track.id] ? (
                <Box sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(0, 0, 0, 0.6)'
                }}>
                  <CircularProgress />
                </Box>
              ) : (
                <CardMedia
                  component="img"
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                  image={trackDetails[track.id]?.album?.images[0]?.url || `https://via.placeholder.com/300x300.png?text=${encodeURIComponent(track.trackTitle)}`}
                  alt={track.trackTitle}
                />
              )}
            </Box>
            <CardContent>
              <Typography variant="h6" component="div" sx={{ color: '#FFFFFF', mb: 1 }}>
                {track.trackTitle}
              </Typography>
              <Typography variant="subtitle1" sx={{ color: '#AAAAAA', mb: 2 }}>
                {track.artist}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Link 
                  href={track.spotifyUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  sx={{
                    color: '#1DB954',
                    display: 'flex',
                    alignItems: 'center',
                    textDecoration: 'none',
                    '&:hover': {
                      color: '#1ed760'
                    }
                  }}
                >
                  <FaSpotify size={24} style={{ marginRight: '8px' }} />
                  <Typography variant="body2">
                    Listen on Spotify
                  </Typography>
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
