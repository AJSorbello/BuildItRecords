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
  imageUrl?: string;
  spotifyUrl?: string;
  id?: string;
}

const groupByArtists = (releases: Release[]): Artist[] => {
  const artistMap = new Map<string, Artist>();

  releases.forEach(release => {
    if (!artistMap.has(release.artist)) {
      artistMap.set(release.artist, {
        name: release.artist,
        releases: [],
        genres: [],
        imageUrl: undefined,
        spotifyUrl: undefined,
        id: undefined
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

  const fetchArtistImage = async (artistName: string, track: Release) => {
    try {
      // Extract primary artist name if it's a collaboration
      const primaryArtist = artistName.split(/[,&]|\bfeat\b|\bft\b|\bx\b|\bvs\b/i)[0].trim();
      console.log('Fetching image for primary artist:', primaryArtist);

      // Try to get artist details from Spotify
      const artistDetails = await spotifyService.getArtistDetailsByName(primaryArtist, track.title);
      
      if (artistDetails?.images?.[0]?.url) {
        console.log('Found Spotify image for artist:', primaryArtist);
        // Update local storage with the new image
        const storedImages = JSON.parse(localStorage.getItem('artistImages') || '{}');
        storedImages[artistName] = artistDetails.images[0].url;
        localStorage.setItem('artistImages', JSON.stringify(storedImages));
        return artistDetails.images[0].url;
      } else {
        console.log('No Spotify image found for artist:', primaryArtist);
        // Fall back to track album cover if no artist image found
        return track.artwork || 'https://via.placeholder.com/300';
      }
    } catch (error) {
      console.error('Error fetching artist image:', error);
      return track.artwork || 'https://via.placeholder.com/300';
    }
  };

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
              // Extract only the first artist name for the search
              const primaryArtist = artist.name.split(/[,&]/)[0].trim();
              console.log(`Processing artist: ${primaryArtist} (from: ${artist.name})`);
              
              // Try to get artist details from Spotify using artist name first
              const spotifyArtist = await spotifyService.getArtistDetailsByName(primaryArtist);

              if (spotifyArtist && spotifyArtist.images?.length > 0) {
                console.log(`Found Spotify artist: ${spotifyArtist.name}`);
                console.log(`Image URL: ${spotifyArtist.images[0].url}`);
                
                return {
                  ...artist,
                  imageUrl: spotifyArtist.images[0].url || '',
                  genres: spotifyArtist.genres || [],
                  spotifyUrl: spotifyArtist.external_urls?.spotify || '',
                  id: spotifyArtist.id
                };
              }

              // If no artist found with just the name, try with a track title
              const firstRelease = artist.releases[0];
              if (firstRelease) {
                // Remove any "Original Mix" or "Remix" suffixes for better search
                const cleanTrackTitle = firstRelease.title.replace(/[\s-]+(Original Mix|Remix)$/i, '');
                console.log(`Trying with track title for ${primaryArtist}: ${cleanTrackTitle}`);
                
                const spotifyArtistWithTrack = await spotifyService.getArtistDetailsByName(
                  primaryArtist,
                  cleanTrackTitle
                );

                if (spotifyArtistWithTrack?.images && Array.isArray(spotifyArtistWithTrack.images) && spotifyArtistWithTrack.images.length > 0) {
                  console.log(`Found Spotify artist using track: ${spotifyArtistWithTrack.name}`);
                  const imageUrl = spotifyArtistWithTrack.images[0]?.url;
                  console.log(`Image URL: ${imageUrl}`);
                  
                  return {
                    ...artist,
                    imageUrl: imageUrl || artist.imageUrl || '',
                    genres: spotifyArtistWithTrack.genres || [],
                    spotifyUrl: spotifyArtistWithTrack.external_urls?.spotify || '',
                    id: spotifyArtistWithTrack.id
                  };
                }
              }

              // If no Spotify image found, use default image
              console.log(`No Spotify profile image found for ${primaryArtist}`);
              return {
                ...artist,
                imageUrl: '/default-artist-image.jpg'
              };
            } catch (error) {
              console.error(`Error getting Spotify details for ${artist.name}:`, error);
            }

            // If all attempts fail, return artist without image
            console.warn(`No valid image found for ${artist.name}`);
            return {
              ...artist,
              imageUrl: undefined // Explicitly set to undefined to indicate no valid image
            };
          })
        );

        // Fetch artist images
        const artistsWithImages = await Promise.all(
          artistsWithSpotifyDetails.map(async (artist) => {
            if (!artist.imageUrl) {
              const firstRelease = artist.releases[0];
              if (firstRelease) {
                const image = await fetchArtistImage(artist.name, firstRelease);
                return {
                  ...artist,
                  imageUrl: image
                };
              }
            }
            return artist;
          })
        );

        setArtists(artistsWithImages);
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
                      image={artist.imageUrl}
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
