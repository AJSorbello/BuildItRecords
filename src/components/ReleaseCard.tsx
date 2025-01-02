import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Link,
  Box,
} from '@mui/material';
import { OpenInNew as OpenInNewIcon } from '@mui/icons-material';

interface ReleaseCardProps {
  id: string;
  name: string;
  artist: string;
  imageUrl?: string;
  releaseDate: Date;
  spotifyUrl?: string;
}

const ReleaseCard: React.FC<ReleaseCardProps> = ({
  name,
  artist,
  imageUrl,
  releaseDate,
  spotifyUrl,
}) => {
  const formattedDate = new Date(releaseDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {imageUrl && (
        <CardMedia
          component="img"
          image={imageUrl}
          alt={`${name} by ${artist}`}
          sx={{ aspectRatio: '1/1', objectFit: 'cover' }}
        />
      )}
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h6" component="h2" gutterBottom noWrap>
          {name}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          {artist}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Released: {formattedDate}
        </Typography>
        {spotifyUrl && (
          <Box sx={{ mt: 2 }}>
            <Link
              href={spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
            >
              Listen on Spotify
              <OpenInNewIcon sx={{ fontSize: 16 }} />
            </Link>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ReleaseCard;
