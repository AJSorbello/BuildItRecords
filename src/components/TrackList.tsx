import React from 'react';
import { Box, Typography, IconButton, Card, CardMedia, CardContent } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Track } from '../types/track';

interface TrackListProps {
  tracks: Track[];
}

const TrackList: React.FC<TrackListProps> = ({ tracks }) => {
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
    <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
      {tracks.map((track) => (
        <Card key={track.id} sx={{ 
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          bgcolor: 'background.paper',
          borderRadius: 2,
          overflow: 'hidden',
          transition: 'transform 0.2s',
          '&:hover': {
            transform: 'scale(1.02)'
          }
        }}>
          <CardMedia
            component="img"
            height="200"
            image={track.artworkUrl || '/placeholder-album.jpg'}
            alt={track.title}
            sx={{ objectFit: 'cover' }}
          />
          
          <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" component="div" gutterBottom noWrap>
              {track.title}
            </Typography>
            
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {track.artists[0]?.name || 'Unknown Artist'}
            </Typography>
            
            <Typography variant="caption" color="text.secondary">
              {new Date(track.releaseDate || '').toLocaleDateString()}
            </Typography>
            
            {/* Actions */}
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 'auto', pt: 1 }}>
              {track.external_urls.spotify && (
                <IconButton
                  size="small"
                  onClick={() => window.open(track.external_urls.spotify, '_blank')}
                  sx={{ color: 'primary.main' }}
                >
                  <OpenInNewIcon />
                </IconButton>
              )}
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default TrackList;
