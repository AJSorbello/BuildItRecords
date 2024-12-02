import React from 'react';
import { Box, Typography, Grid, Card, CardMedia, styled, IconButton, Link } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { FaSpotify } from 'react-icons/fa';
import { Track } from '../types/track';
import { getSpotifyAlbumArt } from '../utils/trackUtils';

interface AdminTrackListProps {
  tracks: Track[];
  handleEdit: (track: Track) => void;
  handleDelete: (id: string) => void;
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

const AdminTrackList: React.FC<AdminTrackListProps> = ({ tracks, handleEdit, handleDelete }) => {
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
    <Box sx={{ width: '100%' }}>
      <Grid container spacing={2}>
        {tracks.map((track) => (
          <Grid item xs={12} key={track.id}>
            <TrackCard>
              <CardMedia
                component="img"
                sx={{ width: 60, height: 60 }}
                image={getSpotifyAlbumArt(track.spotifyUrl) || '/placeholder-album.png'}
                alt={`${track.trackTitle} cover`}
              />
              <Box sx={{ display: 'flex', flexGrow: 1, alignItems: 'center', px: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 3 }}>
                  <Typography 
                    variant="subtitle1" 
                    component="div" 
                    sx={{ 
                      color: 'text.primary',
                      flexGrow: 1,
                      fontWeight: 'bold'
                    }}
                  >
                    {track.trackTitle}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ minWidth: '120px' }}
                  >
                    {track.artist}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ minWidth: '120px' }}
                  >
                    {track.recordLabel}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton 
                      onClick={() => handleEdit(track)} 
                      size="small"
                      sx={{ color: '#02FF95' }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      onClick={() => handleDelete(track.id)} 
                      size="small"
                      sx={{ color: '#FF4444' }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
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
                </Box>
              </Box>
            </TrackCard>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default AdminTrackList;
