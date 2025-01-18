import React from 'react';
import { Card, CardContent, CardMedia, Typography, IconButton, Box, Grid, Link } from '@mui/material';
import { PlayArrow as SpotifyIcon } from '@mui/icons-material';
import { Track } from '../types/track';
import { PlayButton } from './PlayButton';
import { getTrackImage, getTrackSpotifyUrl, getTrackReleaseDate, getTrackArtists } from '../utils/trackUtils';

interface ReleaseCardProps {
  track: Track;
  onClick?: () => void;
  ranking?: number;
}

export const ReleaseCard: React.FC<ReleaseCardProps> = ({ track, onClick, ranking }) => {
  const imageUrl = getTrackImage(track);
  const spotifyUrl = getTrackSpotifyUrl(track);
  const releaseDate = getTrackReleaseDate(track);
  const artists = getTrackArtists(track);

  return (
    <Card 
      sx={{ 
        maxWidth: 345,
        cursor: onClick ? 'pointer' : 'default',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
      onClick={onClick}
    >
      <Box sx={{ position: 'relative' }}>
        <CardMedia
          component="img"
          height="200"
          image={imageUrl || '/placeholder-album.jpg'}
          alt={track.name}
        />
        {track.preview_url && (
          <Box sx={{ position: 'absolute', bottom: 8, right: 8 }}>
            <PlayButton url={track.preview_url} />
          </Box>
        )}
        {ranking && (
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              backgroundColor: 'primary.main',
              color: 'white',
              width: 32,
              height: 32,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Typography variant="body1">{ranking}</Typography>
          </Box>
        )}
      </Box>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography gutterBottom variant="h6" component="div" noWrap>
            {track.name}
          </Typography>
          {spotifyUrl && (
            <IconButton 
              href={spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              <SpotifyIcon />
            </IconButton>
          )}
        </Box>
        <Typography variant="body2" color="text.secondary" noWrap>
          {artists}
        </Typography>
        {releaseDate && (
          <Typography variant="body2" color="text.secondary">
            Released: {new Date(releaseDate).toLocaleDateString()}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default ReleaseCard;
