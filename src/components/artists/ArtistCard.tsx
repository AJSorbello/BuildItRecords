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

  const handleOpenModal = () => {
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  return (
    <>
      <Card sx={{ height: '100%' }}>
        <CardActionArea onClick={handleOpenModal}>
          <CardMedia
            component="img"
            height="200"
            image={artist.profile_image || '/placeholder.png'}
            alt={artist.name}
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
