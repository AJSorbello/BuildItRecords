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
  release: any; // Using any temporarily to handle both formats
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

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Release date unavailable';
    }
  };

  // Handle both server response format and client format
  const getTitle = () => {
    return release.title || release.name || track?.name || 'Untitled';
  };

  const getArtists = () => {
    if (release.artists) {
      if (Array.isArray(release.artists)) {
        return release.artists.map((artist: any) => artist.name || artist).join(', ');
      }
      return release.artists;
    }
    if (track?.artists) {
      return Array.isArray(track.artists) 
        ? track.artists.map(artist => typeof artist === 'string' ? artist : artist.name).join(', ')
        : track.artists;
    }
    return 'Unknown Artist';
  };

  const getAlbumCover = () => {
    if (release.albumCover) return release.albumCover;
    if (release.images && release.images.length > 0) return release.images[0].url;
    if (release.album?.images && release.album.images.length > 0) return release.album.images[0].url;
    if (track?.album?.images?.[0]?.url) return track.album.images[0].url;
    return '/placeholder-album.jpg';
  };

  const getSpotifyUrl = () => {
    if (release.spotifyUrl) return release.spotifyUrl;
    if (release.external_urls?.spotify) return release.external_urls.spotify;
    if (track?.external_urls?.spotify) return track.external_urls.spotify;
    return null;
  };

  const getPreviewUrl = () => {
    return release.preview_url || track?.preview_url || null;
  };

  const getReleaseDate = () => {
    return release.releaseDate || release.release_date || null;
  };

  const getAlbumName = () => {
    return release.album?.name || release.album || track?.album?.name || '';
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
        sx={{
          height: featured ? 400 : 200,
          objectFit: 'cover'
        }}
        image={getAlbumCover()}
        alt={getTitle()}
      />
      <CardContent sx={{ flexGrow: 1, position: 'relative', p: 2 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant={featured ? 'h5' : 'h6'} component="h2" gutterBottom>
            {getTitle()}
          </Typography>
          <Typography 
            variant="subtitle1" 
            color="text.primary" 
            sx={{ fontWeight: 500, mb: 1 }}
          >
            {getArtists()}
          </Typography>
        </Box>
        
        <Box sx={{ mb: 2 }}>
          {getReleaseDate() && (
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ 
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                mb: 0.5 
              }}
            >
              Release Date: {formatDate(getReleaseDate())}
            </Typography>
          )}
          {track?.duration_ms && (
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ mb: 0.5 }}
            >
              Duration: {formatDuration(track.duration_ms)}
            </Typography>
          )}
        </Box>

        <Box sx={{ 
          position: 'absolute', 
          bottom: 16, 
          right: 16,
          display: 'flex',
          gap: 1
        }}>
          {getSpotifyUrl() && (
            <IconButton
              component={Link}
              href={getSpotifyUrl()}
              target="_blank"
              rel="noopener noreferrer"
              size="small"
              sx={{ 
                color: theme.palette.primary.main,
                '&:hover': {
                  color: theme.palette.primary.dark
                }
              }}
            >
              <PlayIcon />
            </IconButton>
          )}
          {getPreviewUrl() && (
            <Link
              href={getPreviewUrl()}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ 
                color: 'primary.main',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                '&:hover': {
                  color: 'primary.dark',
                  textDecoration: 'underline'
                }
              }}
            >
              Preview
            </Link>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ReleaseCard;
