import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardMedia, Typography, Box, CircularProgress } from '@mui/material';
import { Artist } from '../types/artist';
import { API_URL } from '../config';
import { databaseService } from '../services/DatabaseService';

interface ArtistCardProps {
  artist: Artist;
  onClick?: () => void;
  background?: string;
}

const ArtistCard: React.FC<ArtistCardProps> = ({ artist, onClick, background }) => {
  const [artistImage, setArtistImage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Try to fetch artist's releases if no profile image is available
  const fetchArtistReleases = async (artistId: string) => {
    try {
      setIsLoading(true);
      
      // Use the new method that includes releases with the artist
      const artistWithReleases = await databaseService.getArtistWithReleases(artistId);
      
      if (artistWithReleases && artistWithReleases.image_url && 
          artistWithReleases.image_url !== '/images/placeholder-artist.jpg') {
        console.log(`Using artist image for ${artist.name}: ${artistWithReleases.image_url}`);
        setArtistImage(artistWithReleases.image_url);
        return;
      }
      
      // Fall back to the previous implementation if needed
      const response = await fetch(`${API_URL}/api/artist-releases/${artistId}?limit=1`);
      const data = await response.json();
      
      if (data.success && data.data.length > 0) {
        const release = data.data[0];
        // Get the release artwork
        const releaseArtwork = release.artwork_url || 
                              (release.images && release.images.length > 0 ? release.images[0].url : '');
        
        if (releaseArtwork) {
          console.log(`Using release artwork for artist ${artist.name}: ${releaseArtwork}`);
          setArtistImage(releaseArtwork);
          return;
        }
      }
      
      // If no release artwork found, use placeholder
      setArtistImage('/images/placeholder-artist.jpg');
    } catch (error) {
      console.error(`Error fetching releases for artist ${artist.name}:`, error);
      setArtistImage('/images/placeholder-artist.jpg');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Try all possible image fields - added image_url as the first option to check
    const profileImage = artist.image_url || 
                      artist.profile_image_url || 
                      artist.profile_image_small_url || 
                      artist.profile_image_large_url;
    
    if (profileImage) {
      setArtistImage(profileImage);
    } else if (artist.id) {
      // If no profile image, try to get release artwork
      fetchArtistReleases(artist.id);
    } else {
      // If no artist ID, use placeholder
      setArtistImage('/images/placeholder-artist.jpg');
    }
  }, [artist]);

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <Card 
      sx={{ 
        maxWidth: 345,
        cursor: onClick ? 'pointer' : 'default',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: background || 'rgba(20, 20, 22, 0.92)',
        boxShadow: '0 6px 12px rgba(0, 0, 0, 0.6)',
        borderRadius: '8px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        '&:hover': onClick ? {
          transform: 'scale(1.02)',
          transition: 'transform 0.2s ease-in-out',
          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.8)',
          borderColor: 'rgba(255, 255, 255, 0.15)'
        } : {}
      }}
      onClick={handleClick}
    >
      <Box sx={{ position: 'relative', paddingTop: '100%' }}>
        {isLoading ? (
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
              bgcolor: 'rgba(0,0,0,0.2)'
            }}
          >
            <CircularProgress size={40} />
          </Box>
        ) : (
          <CardMedia
            component="img"
            image={artistImage || '/images/placeholder-artist.jpg'}
            alt={artist.name}
            sx={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        )}
      </Box>
      <CardContent sx={{ 
        flexGrow: 1,
        borderTop: '1px solid rgba(255, 255, 255, 0.12)',
        backgroundColor: 'rgba(10, 10, 12, 0.8)',
        paddingBottom: '16px !important'
      }}>
        <Typography gutterBottom variant="h6" component="div" sx={{ color: 'rgba(255, 255, 255, 0.95)' }}>
          {artist.name}
        </Typography>
        {artist.genres && artist.genres.length > 0 && (
          <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
            {artist.genres.join(', ')}
          </Typography>
        )}
        {artist.followers && artist.followers.total && (
          <Typography variant="body2" color="rgba(255, 255, 255, 0.6)">
            {artist.followers.total.toLocaleString()} followers
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export { ArtistCard };
export default ArtistCard;
