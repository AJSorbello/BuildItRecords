import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  CardActionArea
} from '@mui/material';
import { Artist } from '../../types/Artist';
import ArtistModal from './ArtistModal';

interface ArtistCardProps {
  artist: Artist;
}

const ArtistCard: React.FC<ArtistCardProps> = ({ artist }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleOpenModal = () => {
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  // Get the best available image URL
  const getImageUrl = () => {
    if (imageError) {
      return '/assets/images/default-artist.jpg';
    }

    // Try profile_image first
    if (artist.profile_image) {
      return artist.profile_image;
    }

    // Then try images array
    if (artist.images && artist.images.length > 0) {
      return artist.images[0].url;
    }

    // Default image
    return '/assets/images/default-artist.jpg';
  };

  return (
    <>
      <Card sx={{ height: '100%' }}>
        <CardActionArea onClick={handleOpenModal}>
          <CardMedia
            component="img"
            height="200"
            image={getImageUrl()}
            alt={artist.name}
            onError={handleImageError}
            sx={{
              objectFit: 'cover'
            }}
          />
          <CardContent>
            <Typography gutterBottom variant="h6" component="div" noWrap>
              {artist.name}
            </Typography>
            {artist.bio && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical'
                }}
              >
                {artist.bio}
              </Typography>
            )}
          </CardContent>
        </CardActionArea>
      </Card>

      <ArtistModal
        open={modalOpen}
        onClose={handleCloseModal}
        artist={artist}
      />
    </>
  );
};

export default ArtistCard;
