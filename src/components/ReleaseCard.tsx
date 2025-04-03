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
  styled,
  CircularProgress
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
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const theme = useMuiTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
          
          // Process tracks to ensure they have proper Spotify URLs
          if (fetchedRelease.tracks && fetchedRelease.tracks.length > 0) {
            fetchedRelease.tracks = fetchedRelease.tracks.map((track: any) => {
              // Use the DatabaseService utility method for consistent processing
              return databaseService.processTrackForPlayback(track);
            });
          }
          
          // Open the modal with the complete release data
          setCompleteRelease(fetchedRelease);
        } else {
          console.warn(`[ReleaseCard] Failed to fetch complete release data for ${release.id}, using original data`);
          setCompleteRelease(release);
        }
      } else {
        // We already have tracks, use the existing release data but ensure they have proper URLs
        console.log(`[ReleaseCard] Release ${release.id} already has ${release.tracks.length} tracks`);
        
        // Create a deep copy to avoid mutating the original release
        const enhancedRelease = {
          ...release,
          tracks: release.tracks.map((track: any) => {
            // Use the DatabaseService utility method for consistent processing
            return databaseService.processTrackForPlayback(track);
          })
        };
        
        setCompleteRelease(enhancedRelease);
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
            boxShadow: '0 12px 20px rgba(0, 0, 0, 0.25)',
            '& .play-icon': {
              opacity: 1,
            },
            borderColor: 'rgba(255, 255, 255, 0.15)'
          },
          boxShadow: '0 6px 12px rgba(0, 0, 0, 0.6)',
          borderRadius: '8px',
          overflow: 'hidden',
          background: 'rgba(20, 20, 22, 0.92)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(10px)'
        }}
      >
        {ranking && (
          <Box
            sx={{
              position: 'absolute',
              top: 10,
              left: 10,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1,
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>
              {ranking}
            </Typography>
          </Box>
        )}

        <CardActionArea onClick={handleClick} sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
          <Box 
            position="relative" 
            borderRadius={1}
            overflow="hidden"
            sx={{ 
              aspectRatio: '1/1',
              width: '100%', 
              height: 'auto',
              backgroundColor: 'rgba(20, 20, 25, 0.5)',
              transition: 'all 0.3s ease-in-out'
            }}
          >
            {!imageLoaded && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(20, 20, 25, 0.5)',
                }}
              >
                <CircularProgress size={40} thickness={4} />
              </Box>
            )}
            <CardMedia
              component="img"
              src={artworkUrl}
              alt={release.title}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'transform 0.3s ease-in-out',
                opacity: imageLoaded ? 1 : 0,
                '&:hover': {
                  transform: 'scale(1.05)',
                },
              }}
            />
          </Box>

          <Box 
            className="play-icon"
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              opacity: 0,
              transition: 'opacity 0.2s',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              borderRadius: '50%',
              width: 60,
              height: 60,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)',
              border: '2px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <PlayArrowIcon sx={{ fontSize: 40, color: 'white' }} />
          </Box>

          <CardContent sx={{ 
            flexGrow: 1, 
            display: 'flex', 
            flexDirection: 'column',
            backgroundColor: 'rgba(10, 10, 12, 0.8)',
            paddingBottom: '16px !important'
          }}>
            <Typography 
              variant="subtitle1" 
              component="h2" 
              gutterBottom 
              sx={{ 
                fontWeight: 'medium',
                color: 'rgba(255, 255, 255, 0.95)'
              }}
            >
              {release.title}
            </Typography>

            <Box sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AvatarGroup 
                  max={3} 
                  sx={{ 
                    mr: 1,
                    '& .MuiAvatar-root': {
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      width: 24,
                      height: 24
                    }
                  }}
                >
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
                <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                  {artists.map(artist => artist.name).join(', ')}
                </Typography>
              </Box>
            </Box>

            {release.release_date && (
              <Typography variant="caption" color="rgba(255, 255, 255, 0.6)">
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
