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
}

export const ReleaseCard: React.FC<ReleaseCardProps> = ({ release, ranking }) => {
  const [modalOpen, setModalOpen] = useState(false);

  // Early return if release is undefined or invalid
  if (!release || typeof release !== 'object') {
    console.error('Invalid release passed to ReleaseCard:', release);
    return null;
  }

  const handleClick = () => {
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
  const name = release.name || 'Untitled Release';
  const releaseDate = release.release_date || '';

  return (
    <>
      <Card 
        onClick={handleClick}
        sx={{
          cursor: 'pointer',
          backgroundColor: 'transparent',
          boxShadow: 'none',
          transition: 'transform 0.2s',
          '&:hover': {
            transform: 'scale(1.02)',
          },
        }}
      >
        <Box sx={{ position: 'relative', paddingTop: '100%', width: '100%' }}>
          <CardMedia
            component="img"
            image={imageUrl || '/default-album-art.png'}
            alt={name}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '4px'
            }}
          />
          {ranking && (
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                left: 8,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                color: '#fff',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '0.875rem',
              }}
            >
              #{ranking}
            </Box>
          )}
          {previewUrl && (
            <Box sx={{ position: 'absolute', bottom: 8, right: 8 }}>
              <PlayButton url={previewUrl} />
            </Box>
          )}
        </Box>
        <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
          <Typography 
            variant="subtitle1" 
            component="div" 
            sx={{ 
              color: '#fff',
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {name}
          </Typography>
          {artists && (
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {artists}
            </Typography>
          )}
          {releaseDate && (
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {new Date(releaseDate).toLocaleDateString()}
            </Typography>
          )}
          {spotifyUrl && (
            <Box sx={{ mt: 'auto', pt: 1 }}>
              <Link href={spotifyUrl} target="_blank" rel="noopener noreferrer">
                <IconButton size="small" color="primary">
                  <SpotifyIcon />
                </IconButton>
              </Link>
            </Box>
          )}
        </CardContent>
      </Card>
      {modalOpen && (
        <ReleaseModal
          open={modalOpen}
          onClose={handleClose}
          release={release}
        />
      )}
    </>
  );
};
