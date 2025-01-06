import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  IconButton,
  Link
} from '@mui/material';
import { PlayArrow as PlayIcon } from '@mui/icons-material';
import type { Track } from '../types/track';
import type { Release } from '../types/release';
import { formatDuration } from '../utils/trackUtils';
import { useTheme } from '@mui/material/styles';

interface ReleaseCardProps {
  release?: Release;
  track?: Track;
  featured?: boolean;
  ranking?: number;
  onClick?: () => void;
}

export const ReleaseCard: React.FC<ReleaseCardProps> = ({
  release,
  track,
  featured = false,
  ranking,
  onClick
}) => {
  const theme = useTheme();
  const item = release || track;

  if (!item) return null;

  const getImageUrl = () => {
    if (release?.artworkUrl) return release.artworkUrl;
    if (release?.artwork) return release.artwork;
    if (track?.album?.images?.[0]?.url) return track.album.images[0].url;
    return '/placeholder-release.png';
  };

  const getTitle = () => {
    if (release?.title) return release.title;
    if (track?.name) return track.name;
    return 'Untitled';
  };

  const getArtist = () => {
    if (release?.artist) return release.artist;
    if (track?.artists?.[0]?.name) return track.artists[0].name;
    return 'Unknown Artist';
  };

  const getSpotifyUrl = () => {
    if (release?.spotifyUrl) return release.spotifyUrl;
    if (track?.external_urls?.spotify) return track.external_urls.spotify;
    return '';
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? {
          transform: 'scale(1.02)',
          transition: 'transform 0.2s ease-in-out'
        } : {}
      }}
      onClick={onClick}
    >
      {ranking && (
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            left: 10,
            bgcolor: 'primary.main',
            color: 'white',
            borderRadius: '50%',
            width: 30,
            height: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1
          }}
        >
          {ranking}
        </Box>
      )}
      <CardMedia
        component="img"
        image={getImageUrl()}
        alt={getTitle()}
        sx={{
          height: featured ? 400 : 200,
          objectFit: 'cover'
        }}
      />
      <CardContent sx={{ flexGrow: 1, position: 'relative' }}>
        <Typography variant={featured ? 'h5' : 'h6'} component="h2" gutterBottom>
          {getTitle()}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          {getArtist()}
        </Typography>
        {track?.duration_ms && (
          <Typography variant="body2" color="text.secondary">
            {formatDuration(track.duration_ms)}
          </Typography>
        )}
        {item.label && (
          <Typography variant="body2" color="text.secondary">
            {item.label.displayName}
          </Typography>
        )}
        {getSpotifyUrl() && (
          <Box sx={{ position: 'absolute', bottom: 8, right: 8 }}>
            <IconButton
              component={Link}
              href={getSpotifyUrl()}
              target="_blank"
              rel="noopener noreferrer"
              size="small"
              sx={{ color: theme.palette.primary.main }}
            >
              <PlayIcon />
            </IconButton>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
