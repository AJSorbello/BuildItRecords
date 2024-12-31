import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  IconButton,
  Box,
  Link,
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Track } from '../types/track';

interface ReleaseCardProps {
  track: Track;
  onClick?: () => void;
}

const ReleaseCard: React.FC<ReleaseCardProps> = ({ track, onClick }) => {
  return (
    <Card
      onClick={onClick}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s',
        '&:hover': {
          transform: onClick ? 'scale(1.02)' : 'none',
        },
      }}
    >
      <CardMedia
        component="img"
        height="200"
        image={track.artworkUrl || '/default-album-art.png'}
        alt={track.title}
        sx={{ objectFit: 'cover' }}
      />
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" component="div" gutterBottom noWrap>
          {track.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {track.artists.map(artist => artist.name).join(', ')}
        </Typography>
        {track.releaseDate && (
          <Typography variant="caption" color="text.secondary">
            {new Date(track.releaseDate).toLocaleDateString()}
          </Typography>
        )}
        {track.label && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            {track.label}
          </Typography>
        )}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 'auto', pt: 1 }}>
          {track.spotifyUrl && (
            <Link
              href={track.spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              <IconButton size="small" sx={{ color: 'primary.main' }}>
                <OpenInNewIcon />
              </IconButton>
            </Link>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ReleaseCard;
