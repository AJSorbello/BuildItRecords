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
}

const groupByArtists = (releases: Release[]): Artist[] => {
  const artistMap = new Map<string, Artist>();

  releases.forEach(release => {
    if (!artistMap.has(release.artist)) {
      artistMap.set(release.artist, {
        name: release.artist,
        releases: [],
        genres: [],
        image: release.artwork, // Use the first release's artwork as initial image
      });
    }
    const artist = artistMap.get(release.artist)!;
    artist.releases.push(release);
    
    // Update image if not set and this release has artwork
    if (!artist.image && release.artwork) {
      artist.image = release.artwork;
    }
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
}));

const ArtistListPage: React.FC = () => {
  const { label } = useParams<{ label: 'records' | 'tech' | 'deep' }>();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadArtists = async () => {
      try {
        setLoading(true);
        const releases = await fetch('/api/releases').then(res => res.json());
        const allArtists = groupByArtists(releases);
        const filteredArtists = filterByLabel(allArtists, label || 'records');

        // Try to get Spotify images for each artist
        const artistsWithImages = await Promise.all(
          filteredArtists.map(async (artist) => {
            // Try each release to find the artist on Spotify
            for (const release of artist.releases) {
              const cleanTrackTitle = release.title.replace(/[\s-]+(Original Mix|Remix)$/i, '');
              const spotifyArtist = await spotifyService.getArtistDetailsByName(artist.name, cleanTrackTitle);
              
              if (spotifyArtist?.images?.[0]?.url) {
                return {
                  ...artist,
                  image: spotifyArtist.images[0].url,
                  genres: spotifyArtist.genres || []
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
            <Grid item xs={12} sm={6} md={4} key={artist.name}>
              <RouterLink to={`/artist/${encodeURIComponent(artist.name)}`} style={{ textDecoration: 'none' }}>
                <StyledCard>
                  <CardMedia
                    component="img"
                    height="200"
                    image={artist.image || 'https://via.placeholder.com/300?text=No+Profile+Image'}
                    alt={artist.name}
                    sx={{ objectFit: 'cover' }}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="div" sx={{ color: 'text.primary' }}>
                      {artist.name}
                    </Typography>
                    {artist.genres.length > 0 && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {artist.genres.join(', ')}
                      </Typography>
                    )}
                    <Typography variant="body2" color="text.secondary">
                      {artist.releases.length} {artist.releases.length === 1 ? 'Release' : 'Releases'}
                    </Typography>
                  </CardContent>
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
