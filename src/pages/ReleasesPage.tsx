import * as React from 'react';
import { Box, Typography, Grid, Card, CardContent, CardMedia, CardActionArea, Link, styled } from '@mui/material';
import { FaSpotify, FaSoundcloud } from 'react-icons/fa';
import { SiBeatport } from 'react-icons/si';
import { labelColors } from '../theme/theme';

interface Release {
  id: string;
  title: string;
  artist: string;
  artwork: string;
  releaseDate: string;
  label: string;
  beatportUrl?: string;
  spotifyUrl?: string;
  soundcloudUrl?: string;
}

interface ReleasesPageProps {
  label: 'records' | 'tech' | 'deep';
}

const StyledLink = styled(Link)({
  color: '#FFFFFF',
  marginRight: '16px',
  '&:hover': {
    color: '#02FF95',
  },
});

const getReleases = (label: string): Release[] => {
  switch (label) {
    case 'tech':
      return [
        {
          id: '1',
          title: 'Warehouse Techno',
          artist: 'Techno Warrior',
          artwork: 'https://via.placeholder.com/300',
          releaseDate: '2024-01-10',
          label: 'Build It Tech',
          beatportUrl: 'https://www.beatport.com',
          spotifyUrl: 'https://open.spotify.com',
        },
        {
          id: '2',
          title: 'Industrial Mind',
          artist: 'Dark Matter',
          artwork: 'https://via.placeholder.com/300',
          releaseDate: '2023-12-15',
          label: 'Build It Tech',
          beatportUrl: 'https://www.beatport.com',
          soundcloudUrl: 'https://soundcloud.com',
        },
      ];
    case 'deep':
      return [
        {
          id: '1',
          title: 'Ocean Depths',
          artist: 'Deep Dive',
          artwork: 'https://via.placeholder.com/300',
          releaseDate: '2024-01-05',
          label: 'Build It Deep',
          beatportUrl: 'https://www.beatport.com',
          spotifyUrl: 'https://open.spotify.com',
        },
        {
          id: '2',
          title: 'Melodic Journey',
          artist: 'Ocean Floor',
          artwork: 'https://via.placeholder.com/300',
          releaseDate: '2023-12-20',
          label: 'Build It Deep',
          beatportUrl: 'https://www.beatport.com',
          soundcloudUrl: 'https://soundcloud.com',
        },
      ];
    default:
      return [
        {
          id: '1',
          title: 'Summer Nights EP',
          artist: 'DJ Shadow',
          artwork: 'https://via.placeholder.com/300',
          releaseDate: '2023-06-15',
          label: 'Build It Records',
          beatportUrl: 'https://beatport.com',
          spotifyUrl: 'https://spotify.com',
          soundcloudUrl: 'https://soundcloud.com',
        },
        {
          id: '2',
          title: 'Deep Groove',
          artist: 'Night Vision',
          artwork: 'https://via.placeholder.com/300',
          releaseDate: '2023-12-01',
          label: 'Build It Records',
          beatportUrl: 'https://www.beatport.com',
          spotifyUrl: 'https://open.spotify.com',
        },
        {
          id: '3',
          title: 'Underground Vibes',
          artist: 'Bass Culture',
          artwork: 'https://via.placeholder.com/300',
          releaseDate: '2023-11-15',
          label: 'Build It Records',
          beatportUrl: 'https://www.beatport.com',
          soundcloudUrl: 'https://soundcloud.com',
        },
      ];
  }
};

const ReleasesPage: React.FC<ReleasesPageProps> = ({ label }) => {
  const releases = getReleases(label);

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h3" component="h1" gutterBottom sx={{ color: 'text.primary', mb: 4 }}>
        Releases
      </Typography>

      <Grid container spacing={4}>
        {releases.map((release) => (
          <Grid item xs={12} sm={6} md={4} key={release.id}>
            <Card sx={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
            }}>
              <CardActionArea>
                <CardMedia
                  component="img"
                  height="300"
                  image={release.artwork}
                  alt={`${release.title} by ${release.artist}`}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent>
                  <Typography variant="h6" component="h2" sx={{ color: 'text.primary' }}>
                    {release.title}
                  </Typography>
                  <Typography variant="subtitle1" sx={{ color: 'text.secondary', mb: 2 }}>
                    {release.artist}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                    Release Date: {new Date(release.releaseDate).toLocaleDateString()}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {release.beatportUrl && (
                      <StyledLink href={release.beatportUrl} target="_blank">
                        <SiBeatport size={24} />
                      </StyledLink>
                    )}
                    {release.spotifyUrl && (
                      <StyledLink href={release.spotifyUrl} target="_blank">
                        <FaSpotify size={24} />
                      </StyledLink>
                    )}
                    {release.soundcloudUrl && (
                      <StyledLink href={release.soundcloudUrl} target="_blank">
                        <FaSoundcloud size={24} />
                      </StyledLink>
                    )}
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ReleasesPage;
