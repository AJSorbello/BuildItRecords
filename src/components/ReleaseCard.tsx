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
  useMediaQuery,
  styled
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { Release } from '../types/release';
import { ReleaseModal } from './modals/ReleaseModal';
import ArtistModal from './modals/ArtistModal';
import { formatDate } from '../utils/dateUtils';
import { Artist } from '../types/artist';

// Styled component for album artwork
const AlbumArtwork = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  paddingTop: '100%', // 1:1 aspect ratio
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  borderRadius: '4px 4px 0 0',
}));

interface ReleaseCardProps {
  release: Release;
  ranking?: number;
  onClick?: () => void;
}

export const ReleaseCard = ({ release, ranking, onClick }: ReleaseCardProps) => {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [artistModalOpen, setArtistModalOpen] = React.useState(false);
  const [selectedArtist, setSelectedArtist] = React.useState<Artist | null>(null);
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

  const handleArtistClick = (artist: Artist) => {
    setSelectedArtist(artist);
    setArtistModalOpen(true);
    // Keep the release modal open to maintain context
  };

  const handleArtistModalClose = () => {
    setArtistModalOpen(false);
  };

  // Get the best available artist image
  const getArtistImage = (artist: any): string => {
    // Debug the artist object to see what image properties are available
    if (process.env.NODE_ENV === 'development') {
      console.log('Artist image debug:', artist.id, artist.name, {
        profile_image_url: artist.profile_image_url,
        image: artist.image,
        images: artist.images,
        profile_picture: artist.profile_picture
      });
    }
    
    // Try all possible image properties in order of preference
    const artistImage = artist.profile_image_url || 
           artist.image ||
           artist.profile_picture ||
           (artist.images && artist.images.length > 0 ? artist.images[0].url : '') ||
           (artist.profile_image_small_url) || 
           (artist.profile_image_large_url);
           
    // If artist has no image, use the release artwork as fallback
    if (!artistImage) {
      console.log(`No image found for artist ${artist.name}, using release artwork as fallback`);
      return getReleaseArtwork(release);
    }
    
    return artistImage || '/images/placeholder-artist.jpg';
  };

  // Get the best available release artwork
  const getReleaseArtwork = (release: Release): string => {
    console.log("Release artwork:", release.artwork_url, 
                release.images && release.images.length > 0 ? release.images[0].url : "no images");
    
    return release.artwork_url || 
           (release.images && release.images.length > 0 ? release.images[0].url : '') || 
           '/images/placeholder-release.jpg';
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
  const artworkUrl = getReleaseArtwork(release);

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
          boxShadow: theme.shadows[3],
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        {ranking && (
          <Box
            sx={{
              position: 'absolute',
              top: 10,
              left: 10,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1,
            }}
          >
            <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>
              {ranking}
            </Typography>
          </Box>
        )}

        <CardActionArea onClick={handleClick} sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
          <AlbumArtwork 
            sx={{ 
              backgroundImage: `url("${artworkUrl}")`,
              marginBottom: 0,
            }}
          />
          <Box 
            className="play-icon"
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              opacity: 0,
              transition: 'opacity 0.2s',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              borderRadius: '50%',
              width: 60,
              height: 60,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <PlayArrowIcon sx={{ fontSize: 40, color: 'white' }} />
          </Box>

          <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="subtitle1" component="h2" gutterBottom sx={{ fontWeight: 'medium' }}>
              {release.title}
            </Typography>

            <Box sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AvatarGroup max={3} sx={{ mr: 1 }}>
                  {artists.map(artist => (
                    <Avatar 
                      key={artist.id} 
                      src={getArtistImage(artist)} 
                      alt={artist.name}
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
        </CardActionArea>
      </Card>

      {release && (
        <ReleaseModal
          open={modalOpen}
          onClose={handleCloseModal}
          release={release}
          onArtistClick={handleArtistClick}
        />
      )}

      {selectedArtist && (
        <ArtistModal
          open={artistModalOpen}
          onClose={handleArtistModalClose}
          artist={selectedArtist}
        />
      )}
    </>
  );
};
