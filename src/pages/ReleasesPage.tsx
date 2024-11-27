import * as React from 'react';
import { Box, Typography, Grid, Card, CardContent, CardMedia, Link } from '@mui/material';
import { FaSpotify, FaSoundcloud } from 'react-icons/fa';
import { SiBeatport } from 'react-icons/si';

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
        }
      ];
    case 'deep':
      return [
        {
          id: '1',
          title: 'Deep Emotions',
          artist: 'Deep Artist',
          artwork: 'https://via.placeholder.com/300',
          releaseDate: '2024-02-01',
          label: 'Build It Deep',
          spotifyUrl: 'https://open.spotify.com',
          soundcloudUrl: 'https://soundcloud.com',
        }
      ];
    default:
      return [
        {
          id: '1',
          title: 'House Vibes',
          artist: 'House Master',
          artwork: 'https://via.placeholder.com/300',
          releaseDate: '2024-03-01',
          label: 'Build It Records',
          beatportUrl: 'https://www.beatport.com',
          spotifyUrl: 'https://open.spotify.com',
          soundcloudUrl: 'https://soundcloud.com',
        }
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
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
              }
            }}>
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
                    <Link href={release.beatportUrl} target="_blank" sx={{ color: 'white', mr: 2 }}>
                      <SiBeatport size={24} />
                    </Link>
                  )}
                  {release.spotifyUrl && (
                    <Link href={release.spotifyUrl} target="_blank" sx={{ color: 'white', mr: 2 }}>
                      <FaSpotify size={24} />
                    </Link>
                  )}
                  {release.soundcloudUrl && (
                    <Link href={release.soundcloudUrl} target="_blank" sx={{ color: 'white', mr: 2 }}>
                      <FaSoundcloud size={24} />
                    </Link>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ReleasesPage;
