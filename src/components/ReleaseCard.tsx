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
        sx={{ 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}
      >
        <CardActionArea onClick={handleClick}>
          {ranking && (
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                left: 8,
                zIndex: 1,
                bgcolor: 'primary.main',
                color: 'white',
                width: 32,
                height: 32,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                boxShadow: 2
              }}
            >
              {ranking}
            </Box>
          )}
          {imageUrl ? (
            <CardMedia
              component="img"
              height="200"
              image={imageUrl}
              alt={name}
              sx={{ objectFit: 'cover' }}
            />
          ) : (
            <Box
              sx={{
                height: 200,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'grey.900'
              }}
            >
              <AlbumIcon sx={{ fontSize: 80, color: 'grey.600' }} />
            </Box>
          )}
          {previewUrl && (
            <Box sx={{ position: 'absolute', bottom: 8, right: 8 }}>
              <PlayButton url={previewUrl} />
            </Box>
          )}
          <CardContent>
            <Typography variant="h6" component="div" noWrap>
              {name}
            </Typography>
            {artists && (
              <Typography variant="body2" color="text.secondary" gutterBottom noWrap>
                {artists}
              </Typography>
            )}
            {releaseDate && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
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
        </CardActionArea>
      </Card>

      <ReleaseModal
        open={modalOpen}
        onClose={handleClose}
        release={release}
      />
    </>
  );
};
