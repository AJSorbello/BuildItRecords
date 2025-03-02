import React, { useState } from 'react';
import {
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Grid,
  useTheme as useMuiTheme,
  Avatar,
  AvatarGroup,
  Chip,
  Link,
  useMediaQuery
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { Release } from '../types/release';
import { ReleaseModal } from './modals/ReleaseModal';
import { formatDate } from '../utils/dateUtils';

interface ReleaseCardProps {
  release: Release;
  ranking?: number;
  onClick?: () => void;
}

export const ReleaseCard = ({ release, ranking, onClick }: ReleaseCardProps) => {
  const [modalOpen, setModalOpen] = React.useState(false);
  const theme = useMuiTheme();

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  // Get the best available artist image
  const getArtistImage = (artist: any): string => {
    return artist.profile_image_url || 
           artist.profile_image_small_url || 
           artist.profile_image_large_url || 
           (artist.images && artist.images[0]?.url) || 
           '/images/placeholder-artist.jpg';
  };

  // Extract artists from tracks if not available in release
  const getArtistsFromRelease = (release: Release): any[] => {
    if (release.artists && release.artists.length > 0) {
      return release.artists;
    }
    
    // Try to extract artists from tracks
    if (release.tracks && release.tracks.length > 0) {
      const artistsMap = new Map();
      
      release.tracks.forEach(track => {
        if (track.artists && track.artists.length > 0) {
          track.artists.forEach(artist => {
            if (artist && artist.id && !artistsMap.has(artist.id)) {
              artistsMap.set(artist.id, artist);
            }
          });
        }
      });
      
      if (artistsMap.size > 0) {
        return Array.from(artistsMap.values());
      }
    }
    
    // Return a default artist if nothing else is available
    return [{
      id: 'unknown',
      name: 'Unknown Artist',
      profile_image_url: '/images/placeholder-artist.jpg'
    }];
  };

  const artists = getArtistsFromRelease(release);

  return (
    <>
      <Card
        sx={{
          position: 'relative',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
            '& .play-icon': {
              opacity: 1,
            },
          },
          cursor: 'pointer',
          borderRadius: 2,
          overflow: 'hidden',
        }}
        onClick={handleClick}
      >
        <Box sx={{ position: 'relative' }}>
          {ranking && (
            <Chip
              label={`#${ranking}`}
              size="small"
              color="primary"
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 2,
                fontWeight: 'bold',
              }}
            />
          )}

          <CardMedia
            component="img"
            image={release.artwork_url || '/default-artwork.png'}
            alt={release.title}
            sx={{
              aspectRatio: '1/1',
              objectFit: 'cover',
            }}
          />

          <Box
            className="play-icon"
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0,
              transition: 'opacity 0.2s',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
            }}
          >
            <PlayArrowIcon
              sx={{
                fontSize: 64,
                color: 'white',
              }}
            />
          </Box>
        </Box>

        <CardContent sx={{ flexGrow: 1, p: 2 }}>
          <Typography
            variant="h6"
            component="div"
            gutterBottom
            sx={{
              fontWeight: 'bold',
              fontSize: '1rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              minHeight: '2.5rem',
              lineHeight: 1.25,
            }}
          >
            {release.title}
          </Typography>

          {/* Artists with images */}
          <Box sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AvatarGroup
                max={3}
                sx={{
                  '& .MuiAvatar-root': {
                    width: 24,
                    height: 24,
                    fontSize: '0.75rem',
                    border: `1px solid ${theme.palette.background.paper}`,
                  },
                  mr: 1,
                }}
              >
                {artists.map((artist, index) => (
                  <Avatar 
                    key={artist.id || index} 
                    alt={artist.name} 
                    src={getArtistImage(artist)}
                    sx={{ 
                      width: 24, 
                      height: 24,
                    }}
                  />
                ))}
              </AvatarGroup>
              <Typography variant="body2" color="text.secondary">
                {artists.map(artist => artist.name).join(', ')}
              </Typography>
            </Box>
          </Box>

          {release.release_date && (
            <Typography variant="caption" color="text.secondary">
              Released: {formatDate(release.release_date)}
            </Typography>
          )}
        </CardContent>
      </Card>

      {release && (
        <ReleaseModal
          open={modalOpen}
          onClose={handleCloseModal}
          release={release}
        />
      )}
    </>
  );
};
