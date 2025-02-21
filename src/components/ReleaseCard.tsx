import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Chip,
  CardActionArea,
  IconButton,
  Link
} from '@mui/material';
import { Album as AlbumIcon, PlayArrow as SpotifyIcon } from '@mui/icons-material';
import { Release } from '../types/release';
import ReleaseModal from './modals/ReleaseModal';
import { PlayButton } from './PlayButton';

interface ReleaseCardProps {
  release?: Release;
  ranking?: number;
  onClick?: () => void;
}

export const ReleaseCard: React.FC<ReleaseCardProps> = ({ release, ranking, onClick }) => {
  const [modalOpen, setModalOpen] = useState(false);

  // Early return if release is undefined or invalid
  if (!release || typeof release !== 'object') {
    console.error('Invalid release passed to ReleaseCard:', release);
    return null;
  }

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
  };

  const previewUrl = release.tracks?.[0]?.preview_url;
  const imageUrl = release.images?.[0]?.url || release.artwork_url;
  const spotifyUrl = release.external_urls?.spotify;
  const artists = Array.isArray(release.artists) 
    ? release.artists.map(artist => artist?.name || '').filter(Boolean).join(', ') 
    : '';
  const title = release.title || 'Untitled Release';
  const releaseDate = release.release_date || '';

  return (
    <>
      <Card 
        sx={{ 
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          backgroundColor: 'background.paper',
          borderRadius: 2,
          overflow: 'hidden',
          '&:hover': {
            transform: 'scale(1.02)',
            transition: 'transform 0.2s ease-in-out'
          }
        }}
      >
        <CardActionArea onClick={handleClick}>
          <Box sx={{ position: 'relative', paddingTop: '100%' }}>
            {imageUrl ? (
              <CardMedia
                component="img"
                image={imageUrl}
                alt={title}
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            ) : (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'grey.300'
                }}
              >
                <AlbumIcon sx={{ fontSize: 60, color: 'grey.500' }} />
              </Box>
            )}
          </Box>

          <CardContent sx={{ flexGrow: 1, p: 2 }}>
            <Typography variant="subtitle1" component="div" noWrap>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {artists}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              {releaseDate}
            </Typography>
          </CardContent>
        </CardActionArea>

        {/* Spotify and Preview Controls */}
        <Box sx={{ 
          position: 'absolute', 
          top: 8, 
          right: 8, 
          display: 'flex', 
          gap: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          borderRadius: 1,
          padding: '4px'
        }}>
          {spotifyUrl && (
            <IconButton
              size="small"
              href={spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ 
                color: 'white',
                '&:hover': { color: '#1DB954' }
              }}
            >
              <SpotifyIcon />
            </IconButton>
          )}
          {previewUrl && (
            <PlayButton 
              previewUrl={previewUrl}
              size="small"
              sx={{ color: 'white' }}
            />
          )}
        </Box>

        {/* Ranking Badge */}
        {ranking && (
          <Chip
            label={`#${ranking}`}
            size="small"
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              backgroundColor: 'primary.main',
              color: 'white',
              fontWeight: 'bold'
            }}
          />
        )}
      </Card>

      <ReleaseModal
        open={modalOpen}
        onClose={handleClose}
        release={release}
      />
    </>
  );
};
