import React, { useState, useEffect } from 'react';
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
import { databaseService } from '../services/DatabaseService';

interface ReleaseCardProps {
  release: Release;
  ranking?: number;
  onClick?: () => void;
  onReleaseClick?: (release: Release) => void;
}

export const ReleaseCard = ({ release, ranking, onClick, onReleaseClick }: ReleaseCardProps) => {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [artistModalOpen, setArtistModalOpen] = React.useState(false);
  const [selectedArtist, setSelectedArtist] = React.useState<Artist | null>(null);
  const [completeRelease, setCompleteRelease] = React.useState<Release | null>(null);
  const [loading, setLoading] = React.useState(false);
  const theme = useMuiTheme();

  const handleClick = async () => {
    try {
      console.log(`[ReleaseCard] Clicked on release: ${release.id} - ${release.title}`);
      
      // Check if we need to fetch more complete release data
      if (!release.tracks || release.tracks.length === 0) {
        console.log(`[ReleaseCard] Release ${release.id} has no tracks, fetching complete data`);
        
        setLoading(true);
        
        // Fetch the complete release with tracks
        const fetchedRelease = await databaseService.getRelease(release.id);
        
        setLoading(false);
        
        if (fetchedRelease) {
          console.log(`[ReleaseCard] Successfully fetched complete release data for ${release.id}`, {
            hasTracks: fetchedRelease.tracks && fetchedRelease.tracks.length > 0,
            trackCount: fetchedRelease.tracks?.length || 0
          });
          
          // Open the modal with the complete release data
          setCompleteRelease(fetchedRelease);
        } else {
          console.warn(`[ReleaseCard] Failed to fetch complete release data for ${release.id}, using original data`);
          setCompleteRelease(release);
        }
      } else {
        // We already have tracks, use the existing release data
        console.log(`[ReleaseCard] Release ${release.id} already has ${release.tracks.length} tracks`);
        setCompleteRelease(release);
      }
    } catch (error) {
      console.error(`[ReleaseCard] Error handling click for release ${release.id}:`, error);
      // Fall back to using the original release data
      setCompleteRelease(release);
    }
  };

  useEffect(() => {
    if (completeRelease) {
      if (onReleaseClick) onReleaseClick(completeRelease);
      setModalOpen(true);
    }
  }, [completeRelease, onReleaseClick]);

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
        image_url: artist.image_url,
        images: artist.images,
        profile_picture: artist.profile_picture
      });
    }
    
    // Try all possible image properties in order of preference
    const artistImage = artist.image_url || 
           artist.profile_image_url || 
           artist.image ||
           artist.profile_picture ||
           (artist.images && artist.images.length > 0 ? artist.images[0].url : '') ||
           artist.profile_image_small_url || 
           artist.profile_image_large_url;
           
    // If artist has no image, use a dedicated artist placeholder
    // instead of falling back to the release artwork
    if (!artistImage || artistImage === '') {
      console.log(`[ReleaseCard] No image found for artist ${artist.name}, using artist placeholder`);
      return '/images/placeholder-artist.jpg';
    }
    
    return artistImage;
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
          <CardMedia
            component="img"
            image={artworkUrl}
            alt={release.title}
            sx={{ 
              aspectRatio: '1/1',
              objectFit: 'cover',
              borderRadius: '4px 4px 0 0',
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

      {completeRelease && (
        <ReleaseModal
          open={modalOpen}
          onClose={handleCloseModal}
          release={completeRelease}
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
