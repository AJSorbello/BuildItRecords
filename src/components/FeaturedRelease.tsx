import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  IconButton,
  Link,
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useTheme } from '../contexts/ThemeContext';
import { Track } from '../types/track';

interface FeaturedReleaseProps {
  track: Track;
}

const FeaturedRelease: React.FC<FeaturedReleaseProps> = ({ track }) => {
  const { colors } = useTheme();

  return (
    <Card
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        backgroundColor: colors.card,
        borderRadius: 2,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <Box sx={{ 
        position: 'relative', 
        width: { xs: '100%', md: '500px' }, 
        minWidth: { xs: '100%', md: '500px' },
        maxWidth: { xs: '100%', md: '500px' }
      }}>
        <Box sx={{ position: 'relative', paddingTop: '100%', width: '100%' }}>
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
            image={track.artworkUrl || '/default-album-art.png'}
            alt={track.title}
          />
        </Box>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, p: { xs: 3, md: 4 }, position: 'relative', zIndex: 1 }}>
        <CardContent sx={{ flex: '1 0 auto', p: 0, position: 'relative', zIndex: 1 }}>
          <Typography variant="h4" component="div" gutterBottom sx={{ color: colors.text }}>
            {track.title}
          </Typography>
          <Typography variant="h6" color="textSecondary" gutterBottom sx={{ color: colors.textSecondary }}>
            {track.artists.map(artist => artist.name).join(', ')}
          </Typography>
          {track.album && (
            <Typography variant="subtitle1" color="text.secondary" gutterBottom sx={{ color: colors.textSecondary }}>
              Album: {track.album.name}
            </Typography>
          )}
          {track.releaseDate && (
            <Typography variant="body2" color="text.secondary" sx={{ color: colors.textSecondary }}>
              Released: {new Date(track.releaseDate).toLocaleDateString()}
            </Typography>
          )}
          {track.label && (
            <Typography variant="body2" color="text.secondary" sx={{ color: colors.textSecondary }}>
              Label: {track.label}
            </Typography>
          )}
        </CardContent>
        {track.spotifyUrl && (
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', pl: 1, pb: 1 }}>
            <Link
              href={track.spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <IconButton size="small">
                <OpenInNewIcon />
              </IconButton>
              Open in Spotify
            </Link>
          </Box>
        )}
      </Box>
    </Card>
  );
};

export default FeaturedRelease;
