import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { Box, Typography, Card, styled, Grid, CardContent, CardMedia } from '@mui/material';
import PageLayout from '../components/PageLayout';
import { Release } from '../types/release';
import { spotifyService } from '../services/SpotifyService';

interface Artist {
  name: string;
  releases: Release[];
  genres: string[];
  image?: string;
  spotifyId?: string;
}

const groupByArtists = (releases: Release[]): Artist[] => {
  const artistMap = new Map<string, Artist>();

  releases.forEach(release => {
    if (!artistMap.has(release.artist)) {
      artistMap.set(release.artist, {
        name: release.artist,
        releases: [],
        genres: [],
        image: undefined,
        spotifyId: undefined
      });
    }
    const artist = artistMap.get(release.artist)!;
    artist.releases.push(release);
  });

  return Array.from(artistMap.values());
};

const filterByLabel = (artists: Artist[], label: 'records' | 'tech' | 'deep'): Artist[] => {
  return artists.filter(artist => 
    artist.releases.some(release => 
      release.beatportUrl?.includes(label) || 
      release.soundcloudUrl?.includes(label)
    )
  );
};

const StyledCard = styled(Card)(({ theme }) => ({
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'scale(1.02)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  '&::before': {
    content: '""',
    display: 'block',
    paddingTop: '100%', // This creates the 1:1 ratio
  },
}));

const CardMediaWrapper = styled(Box)({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: '30%', // Reserve space for content at bottom
});

const CardContentWrapper = styled(CardContent)({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  height: '30%', // Height for content
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  backdropFilter: 'blur(10px)',
});

const ArtistListPage: React.FC = () => {
  const { label } = useParams<{ label: 'records' | 'tech' | 'deep' }>();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadArtists = async () => {
      try {
        setLoading(true);
        const releases = await fetch('/api/releases').then(res => res.json());
        console.log('Getting artists for label:', label);
        
        const allArtists = groupByArtists(releases);
        const filteredArtists = filterByLabel(allArtists, label || 'records');

        // Get Spotify details for each artist
        const artistsWithSpotifyDetails = await Promise.all(
          filteredArtists.map(async (artist) => {
            try {
              console.log(`Searching Spotify for artist: ${artist.name}`);
              // Try to get artist details from Spotify using artist name first
              const spotifyArtist = await spotifyService.getArtistDetailsByName(artist.name);

              if (spotifyArtist) {
                console.log(`Found Spotify artist: ${spotifyArtist.name}`);
                // Get valid artist profile images and sort by size
                const validImages = spotifyArtist.images
                  .filter(img => {
                    // More thorough image validation
                    const isValid = img.url && 
                      img.width && 
                      img.height && 
                      img.url.startsWith('https://');
                    
                    if (!isValid) {
                      console.log(`Filtered out invalid image for ${artist.name}:`, img);
                    }
                    return isValid;
                  })
                  .sort((a, b) => (b.width || 0) - (a.width || 0));

                if (validImages.length > 0) {
                  const profileImage = validImages[0];
                  console.log(`Using Spotify profile image for ${artist.name}: ${profileImage.url}`);
                  
                  // Validate the image URL before using it
                  try {
                    const response = await fetch(profileImage.url, { 
                      method: 'HEAD',
                      headers: {
                        'Accept': 'image/*'
                      }
                    });
                    
                    if (response.ok && response.headers.get('content-type')?.startsWith('image/')) {
                      return {
                        ...artist,
                        image: profileImage.url,
                        genres: spotifyArtist.genres || [],
                        spotifyId: spotifyArtist.id
                      };
                    } else {
                      console.warn(`Invalid Spotify image URL for ${artist.name}: ${profileImage.url}`);
                    }
                  } catch (error) {
                    console.warn(`Error validating image URL for ${artist.name}:`, error);
                  }
                } else {
                  console.log(`No valid Spotify profile images found for ${artist.name}`);
                }
              } 
              
              // If no valid artist image found, try with a track title
              const firstRelease = artist.releases[0];
              if (firstRelease) {
                console.log(`Trying with track title for ${artist.name}: ${firstRelease.title}`);
                const spotifyArtistWithTrack = await spotifyService.getArtistDetailsByName(
                  artist.name,
                  firstRelease.title
                );

                if (spotifyArtistWithTrack) {
                  const validImages = spotifyArtistWithTrack.images
                    .filter(img => {
                      const isValid = img.url && 
                        img.width && 
                        img.height && 
                        img.url.startsWith('https://');
                      
                      if (!isValid) {
                        console.log(`Filtered out invalid track-based image for ${artist.name}:`, img);
                      }
                      return isValid;
                    })
                    .sort((a, b) => (b.width || 0) - (a.width || 0));

                  if (validImages.length > 0) {
                    const profileImage = validImages[0];
                    console.log(`Found Spotify profile image using track for ${artist.name}: ${profileImage.url}`);
                    
                    // Validate the image URL before using it
                    try {
                      const response = await fetch(profileImage.url, { 
                        method: 'HEAD',
                        headers: {
                          'Accept': 'image/*'
                        }
                      });
                      
                      if (response.ok && response.headers.get('content-type')?.startsWith('image/')) {
                        return {
                          ...artist,
                          image: profileImage.url,
                          genres: spotifyArtistWithTrack.genres || [],
                          spotifyId: spotifyArtistWithTrack.id
                        };
                      } else {
                        console.warn(`Invalid Spotify image URL from track search for ${artist.name}: ${profileImage.url}`);
                      }
                    } catch (error) {
                      console.warn(`Error validating track-based image URL for ${artist.name}:`, error);
                    }
                  }
                }
              }

              // Fall back to release artwork if no valid Spotify image was found
              if (artist.releases[0]?.artwork) {
                console.log(`Falling back to release artwork for ${artist.name}: ${artist.releases[0].artwork}`);
                try {
                  const response = await fetch(artist.releases[0].artwork, { 
                    method: 'HEAD',
                    headers: {
                      'Accept': 'image/*'
                    }
                  });
                  
                  if (response.ok && response.headers.get('content-type')?.startsWith('image/')) {
                    return {
                      ...artist,
                      image: artist.releases[0].artwork
                    };
                  } else {
                    console.warn(`Invalid release artwork URL for ${artist.name}: ${artist.releases[0].artwork}`);
                  }
                } catch (error) {
                  console.warn(`Error validating release artwork URL for ${artist.name}:`, error);
                }
              }

              // If all attempts fail, return artist without image
              console.warn(`No valid image found for ${artist.name}`);
              return {
                ...artist,
                image: undefined // Explicitly set to undefined to indicate no valid image
              };

            } catch (error) {
              console.error(`Error getting Spotify details for ${artist.name}:`, error);
            }

            // Only fall back to release artwork if we couldn't get a Spotify image
            console.log(`Falling back to release artwork for ${artist.name}`);
            return {
              ...artist,
              image: artist.releases[0]?.artwork
            };
          })
        );

        setArtists(artistsWithSpotifyDetails);
      } catch (error) {
        console.error('Error loading artists:', error);
      } finally {
        setLoading(false);
      }
    };

    loadArtists();
  }, [label]);

  if (loading) {
    return (
      <PageLayout label={label || 'records'}>
        <Typography>Loading artists...</Typography>
      </PageLayout>
    );
  }

  return (
    <PageLayout label={label || 'records'}>
      <Box mb={4}>
        <Typography variant="h5" gutterBottom sx={{ color: 'text.primary' }}>
          Artists ({artists.length})
        </Typography>
        <Grid container spacing={3}>
          {artists.map((artist) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={artist.name}>
              <RouterLink to={`/artist/${encodeURIComponent(artist.name)}`} style={{ textDecoration: 'none' }}>
                <StyledCard>
                  <CardMediaWrapper>
                    <CardMedia
                      component="img"
                      image={artist.image}
                      alt={artist.name}
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'center top',
                        backgroundColor: 'rgba(0, 0, 0, 0.1)'
                      }}
                      onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                        const img = e.target as HTMLImageElement;
                        console.log(`Image load error for ${artist.name}, current src: ${img.src}`);
                        if (img.src !== artist.releases[0]?.artwork) {
                          console.log(`Falling back to release artwork for ${artist.name}: ${artist.releases[0]?.artwork}`);
                          img.src = artist.releases[0]?.artwork || '/default-artist.png';
                        } else if (artist.releases[0]?.artwork) {
                          console.log(`Release artwork also failed for ${artist.name}, using default image`);
                          img.src = '/default-artist.png';
                        }
                      }}
                    />
                  </CardMediaWrapper>
                  <CardContentWrapper>
                    <Typography variant="h6" component="div" sx={{ 
                      color: 'text.primary',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {artist.name}
                    </Typography>
                    {artist.genres.length > 0 && (
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                          mb: 0.5,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {artist.genres.slice(0, 2).join(', ')}
                      </Typography>
                    )}
                    <Typography variant="body2" color="text.secondary">
                      {artist.releases.length} {artist.releases.length === 1 ? 'Release' : 'Releases'}
                    </Typography>
                  </CardContentWrapper>
                </StyledCard>
              </RouterLink>
            </Grid>
          ))}
        </Grid>
      </Box>
    </PageLayout>
  );
};

export default ArtistListPage;
