import React from 'react';
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  IconButton,
  Stack,
  Box,
  Link
} from '@mui/material';
import {
  Instagram as InstagramIcon,
  OpenInNew as OpenInNewIcon
} from '@mui/icons-material';
import { SiSoundcloud as SoundCloudIcon } from 'react-icons/si';

export interface ArtistCardProps {
  artist: {
    name: string;
    imageUrl: string;
    bio: string;
    spotifyUrl?: string;
    instagramUrl?: string;
    soundcloudUrl?: string;
    label: string;
  };
}

export const ArtistCard: React.FC<ArtistCardProps> = ({ artist }) => {
  const {
    name,
    imageUrl,
    bio,
    spotifyUrl,
    instagramUrl,
    soundcloudUrl,
    label
  } = artist;

  return (
    <Card elevation={1}>
      <CardMedia
        component="img"
        height="300"
        image={imageUrl}
        alt={name}
        sx={{
          objectFit: 'cover',
          backgroundColor: 'rgba(0, 0, 0, 0.1)'
        }}
      />
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {name}
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          {bio}
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          {spotifyUrl && (
            <Link href={spotifyUrl} target="_blank" rel="noopener noreferrer">
              <IconButton size="small">
                <OpenInNewIcon />
              </IconButton>
            </Link>
          )}
          {instagramUrl && (
            <Link href={instagramUrl} target="_blank" rel="noopener noreferrer">
              <IconButton size="small">
                <InstagramIcon />
              </IconButton>
            </Link>
          )}
          {soundcloudUrl && (
            <Link href={soundcloudUrl} target="_blank" rel="noopener noreferrer">
              <IconButton size="small">
                <SoundCloudIcon />
              </IconButton>
            </Link>
          )}
          <Box flexGrow={1} />
          <Typography variant="caption" color="text.secondary">
            {label}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
};
