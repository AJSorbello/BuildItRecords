import React, { useState, useEffect } from 'react';
import { Box, Typography, IconButton, Card, CardMedia, CardContent, Skeleton, Link } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { FaSpotify } from 'react-icons/fa';
import { Track } from '../types/track';
import { spotifyService } from '../services/SpotifyService';
import { format } from 'date-fns';

interface TrackListProps {
  tracks: Track[];
  onPlayTrack?: (track: Track) => void;
}

const TrackList: React.FC<TrackListProps> = ({ tracks, onPlayTrack }) => {
  const [trackDetails, setTrackDetails] = useState<Record<string, Track>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchAllTrackDetails = async () => {
      for (const track of tracks) {
        if (!trackDetails[track.id] && !loading[track.id]) {
          setLoading(prev => ({ ...prev, [track.id]: true }));
          try {
            const details = await spotifyService.getTrackDetailsByUrl(track.spotifyUrl);
            if (details) {
              setTrackDetails(prev => ({ ...prev, [track.id]: details }));
            }
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

  const getDisplayTrack = (track: Track) => {
    return trackDetails[track.id] || track;
  };

  if (!tracks.length) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" sx={{ color: '#AAAAAA' }}>
          No tracks available
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {tracks.map((track) => {
        const displayTrack = getDisplayTrack(track);
        const isLoading = loading[track.id];

        return (
          <Card
            key={track.id}
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              mb: 2,
              width: '100%',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'scale(1.01)',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
              }
            }}
          >
            {/* Album Cover */}
            {isLoading ? (
              <Skeleton 
                variant="rectangular" 
                width="100%" 
                height={400} 
                animation="wave"
                sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }}
              />
            ) : (
              <CardMedia
                component="img"
                height={400}
                image={displayTrack.albumCover || 'https://via.placeholder.com/400?text=No+Image'}
                alt={displayTrack.trackTitle}
                sx={{
                  objectFit: 'cover',
                  objectPosition: 'center'
                }}
              />
            )}
            
            {/* Track Info */}
            <CardContent sx={{ p: 3 }}>
              {isLoading ? (
                <>
                  <Skeleton 
                    variant="text" 
                    width="60%" 
                    sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} 
                  />
                  <Skeleton 
                    variant="text" 
                    width="40%" 
                    sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} 
                  />
                  <Skeleton 
                    variant="text" 
                    width="30%" 
                    sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} 
                  />
                </>
              ) : (
                <>
                  <Typography variant="h4" sx={{ color: '#FFFFFF', mb: 2, fontWeight: 'bold' }}>
                    {displayTrack.trackTitle}
                  </Typography>
                  <Typography variant="h6" sx={{ color: '#AAAAAA', mb: 2 }}>
                    {displayTrack.artist}
                  </Typography>
                  {displayTrack.releaseDate && (
                    <Typography variant="body1" sx={{ color: '#888888', mb: 3 }}>
                      Released: {format(new Date(displayTrack.releaseDate), 'MMMM d, yyyy')}
                    </Typography>
                  )}
                  
                  {/* Actions */}
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2,
                    mt: 2 
                  }}>
                    {onPlayTrack && displayTrack.previewUrl && (
                      <IconButton 
                        onClick={() => onPlayTrack(displayTrack)}
                        sx={{ 
                          color: '#FFFFFF',
                          '&:hover': {
                            color: '#02FF95'
                          }
                        }}
                      >
                        <PlayArrowIcon sx={{ fontSize: 30 }} />
                      </IconButton>
                    )}
                    {displayTrack.spotifyUrl && (
                      <Link
                        href={displayTrack.spotifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          color: '#1DB954', // Spotify green
                          textDecoration: 'none',
                          gap: 1,
                          '&:hover': {
                            color: '#1ed760'
                          }
                        }}
                      >
                        <FaSpotify size={24} />
                        <Typography variant="button">
                          Listen on Spotify
                        </Typography>
                      </Link>
                    )}
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
};

export default TrackList;
