import * as React from 'react';
import { Box, Typography, Grid, Card, CardContent, CardMedia, Link, styled } from '@mui/material';
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
  plays?: number;
}

interface ReleasesPageProps {
  label: 'records' | 'tech' | 'deep';
}

const FeaturedReleaseCard = styled(Card)({
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  transition: 'transform 0.2s',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  maxWidth: 800,
  margin: '0 auto',
  '&:hover': {
    transform: 'scale(1.02)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
});

const ReleaseCard = styled(Card)({
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  transition: 'transform 0.2s',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  '&:hover': {
    transform: 'scale(1.02)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
});

const TopListenCard = styled(Card)({
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  marginBottom: '8px',
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'scale(1.02)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
});

const IconLink = styled(Link)({
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
          artwork: 'https://via.placeholder.com/800',
          releaseDate: '2024-01-10',
          label: 'Build It Tech',
          beatportUrl: 'https://www.beatport.com',
          spotifyUrl: 'https://open.spotify.com',
          plays: 15000,
        },
        {
          id: '2',
          title: 'Industrial Mind',
          artist: 'Dark Matter',
          artwork: 'https://via.placeholder.com/300',
          releaseDate: '2023-12-15',
          label: 'Build It Tech',
          plays: 12000,
        },
        {
          id: '3',
          title: 'Deep Emotions',
          artist: 'Deep Artist',
          artwork: 'https://via.placeholder.com/300',
          releaseDate: '2024-02-01',
          label: 'Build It Deep',
          spotifyUrl: 'https://open.spotify.com',
          soundcloudUrl: 'https://soundcloud.com',
          plays: 10000,
        },
        {
          id: '4',
          title: 'House Vibes',
          artist: 'House Master',
          artwork: 'https://via.placeholder.com/300',
          releaseDate: '2024-03-01',
          label: 'Build It Records',
          beatportUrl: 'https://www.beatport.com',
          spotifyUrl: 'https://open.spotify.com',
          soundcloudUrl: 'https://soundcloud.com',
          plays: 8000,
        },
        {
          id: '5',
          title: 'Techno Beats',
          artist: 'Techno Beats',
          artwork: 'https://via.placeholder.com/300',
          releaseDate: '2023-11-15',
          label: 'Build It Tech',
          beatportUrl: 'https://www.beatport.com',
          spotifyUrl: 'https://open.spotify.com',
          plays: 6000,
        },
        {
          id: '6',
          title: 'Deep House',
          artist: 'Deep House',
          artwork: 'https://via.placeholder.com/300',
          releaseDate: '2023-10-15',
          label: 'Build It Deep',
          spotifyUrl: 'https://open.spotify.com',
          soundcloudUrl: 'https://soundcloud.com',
          plays: 4000,
        },
        {
          id: '7',
          title: 'House Music',
          artist: 'House Music',
          artwork: 'https://via.placeholder.com/300',
          releaseDate: '2023-09-15',
          label: 'Build It Records',
          beatportUrl: 'https://www.beatport.com',
          spotifyUrl: 'https://open.spotify.com',
          soundcloudUrl: 'https://soundcloud.com',
          plays: 2000,
        },
        {
          id: '8',
          title: 'Techno Tracks',
          artist: 'Techno Tracks',
          artwork: 'https://via.placeholder.com/300',
          releaseDate: '2023-08-15',
          label: 'Build It Tech',
          beatportUrl: 'https://www.beatport.com',
          spotifyUrl: 'https://open.spotify.com',
          plays: 1000,
        },
        {
          id: '9',
          title: 'Deep Tracks',
          artist: 'Deep Tracks',
          artwork: 'https://via.placeholder.com/300',
          releaseDate: '2023-07-15',
          label: 'Build It Deep',
          spotifyUrl: 'https://open.spotify.com',
          soundcloudUrl: 'https://soundcloud.com',
          plays: 500,
        },
        {
          id: '10',
          title: 'House Tracks',
          artist: 'House Tracks',
          artwork: 'https://via.placeholder.com/300',
          releaseDate: '2023-06-15',
          label: 'Build It Records',
          beatportUrl: 'https://www.beatport.com',
          spotifyUrl: 'https://open.spotify.com',
          soundcloudUrl: 'https://soundcloud.com',
          plays: 100,
        },
        {
          id: '11',
          title: 'Warehouse Techno',
          artist: 'Techno Warrior',
          artwork: 'https://via.placeholder.com/300',
          releaseDate: '2024-01-10',
          label: 'Build It Tech',
          beatportUrl: 'https://www.beatport.com',
          spotifyUrl: 'https://open.spotify.com',
          plays: 15000,
        },
        {
          id: '12',
          title: 'Industrial Mind',
          artist: 'Dark Matter',
          artwork: 'https://via.placeholder.com/300',
          releaseDate: '2023-12-15',
          label: 'Build It Tech',
          plays: 12000,
        },
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
          plays: 10000,
        },
        {
          id: '2',
          title: 'Deep House',
          artist: 'Deep House',
          artwork: 'https://via.placeholder.com/300',
          releaseDate: '2023-10-15',
          label: 'Build It Deep',
          spotifyUrl: 'https://open.spotify.com',
          soundcloudUrl: 'https://soundcloud.com',
          plays: 4000,
        },
        {
          id: '3',
          title: 'Deep Tracks',
          artist: 'Deep Tracks',
          artwork: 'https://via.placeholder.com/300',
          releaseDate: '2023-07-15',
          label: 'Build It Deep',
          spotifyUrl: 'https://open.spotify.com',
          soundcloudUrl: 'https://soundcloud.com',
          plays: 500,
        },
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
          plays: 8000,
        },
        {
          id: '2',
          title: 'House Music',
          artist: 'House Music',
          artwork: 'https://via.placeholder.com/300',
          releaseDate: '2023-09-15',
          label: 'Build It Records',
          beatportUrl: 'https://www.beatport.com',
          spotifyUrl: 'https://open.spotify.com',
          soundcloudUrl: 'https://soundcloud.com',
          plays: 2000,
        },
        {
          id: '3',
          title: 'House Tracks',
          artist: 'House Tracks',
          artwork: 'https://via.placeholder.com/300',
          releaseDate: '2023-06-15',
          label: 'Build It Records',
          beatportUrl: 'https://www.beatport.com',
          spotifyUrl: 'https://open.spotify.com',
          soundcloudUrl: 'https://soundcloud.com',
          plays: 100,
        },
      ];
  }
};

const ReleasesPage: React.FC<ReleasesPageProps> = ({ label }) => {
  const releases = getReleases(label);
  const featuredRelease = releases[0];
  const pastReleases = releases.slice(1);

  // Sort releases by plays to get top listened
  const topListened = [...releases].sort((a, b) => (b.plays || 0) - (a.plays || 0)).slice(0, 10);

  return (
    <Box sx={{ maxWidth: 1400, margin: '0 auto', padding: '0 16px' }}>
      <Typography variant="h4" gutterBottom sx={{ color: 'text.primary', textAlign: 'center' }}>
        {label === 'tech' ? 'Build It Tech' : label === 'deep' ? 'Build It Deep' : 'Build It Records'}
      </Typography>
      <Typography variant="h6" sx={{ color: 'text.secondary', mb: 6, textAlign: 'center' }}>
        {label === 'tech' ? 'Techno & Tech House' : label === 'deep' ? 'Deep House' : 'House Music'}
      </Typography>

      <Grid container spacing={4}>
        {/* Main Content Area */}
        <Grid item xs={12} md={9}>
          {/* Featured Release */}
          <Box mb={8}>
            <Typography variant="h5" gutterBottom sx={{ textAlign: 'center', mb: 3 }}>
              Latest Release
            </Typography>
            <FeaturedReleaseCard>
              <CardMedia
                component="img"
                sx={{
                  height: 0,
                  paddingTop: '100%',
                  objectFit: 'cover'
                }}
                image={featuredRelease.artwork}
                alt={featuredRelease.title}
              />
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Typography variant="h4" component="div" sx={{ color: 'text.primary', mb: 1 }}>
                  {featuredRelease.title}
                </Typography>
                <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
                  {featuredRelease.artist}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6" color="text.secondary">
                    {featuredRelease.releaseDate}
                  </Typography>
                  <Box mt={2}>
                    {featuredRelease.beatportUrl && (
                      <IconLink href={featuredRelease.beatportUrl} target="_blank">
                        <SiBeatport size={24} />
                      </IconLink>
                    )}
                    {featuredRelease.spotifyUrl && (
                      <IconLink href={featuredRelease.spotifyUrl} target="_blank">
                        <FaSpotify size={24} />
                      </IconLink>
                    )}
                    {featuredRelease.soundcloudUrl && (
                      <IconLink href={featuredRelease.soundcloudUrl} target="_blank">
                        <FaSoundcloud size={24} />
                      </IconLink>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </FeaturedReleaseCard>
          </Box>

          {/* Past Releases Grid */}
          <Box>
            <Typography variant="h5" gutterBottom sx={{ mb: 4 }}>
              Past Releases
            </Typography>
            <Grid container spacing={3}>
              {pastReleases.map((release) => (
                <Grid item xs={12} sm={6} md={4} key={release.id}>
                  <ReleaseCard>
                    <CardMedia
                      component="img"
                      sx={{
                        height: 0,
                        paddingTop: '100%',
                        objectFit: 'cover'
                      }}
                      image={release.artwork}
                      alt={release.title}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="body1" component="div" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                        {release.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {release.artist}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          {release.releaseDate}
                        </Typography>
                        <Box mt={1}>
                          {release.beatportUrl && (
                            <IconLink href={release.beatportUrl} target="_blank">
                              <SiBeatport size={20} />
                            </IconLink>
                          )}
                          {release.spotifyUrl && (
                            <IconLink href={release.spotifyUrl} target="_blank">
                              <FaSpotify size={20} />
                            </IconLink>
                          )}
                          {release.soundcloudUrl && (
                            <IconLink href={release.soundcloudUrl} target="_blank">
                              <FaSoundcloud size={20} />
                            </IconLink>
                          )}
                        </Box>
                      </Box>
                    </CardContent>
                  </ReleaseCard>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Grid>

        {/* Right Sidebar - Top 10 Most Listened */}
        <Grid item xs={12} md={3}>
          <Box sx={{ position: { md: 'sticky' }, top: { md: '24px' } }}>
            <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
              Top 10 Most Listened
            </Typography>
            {topListened.map((track, index) => (
              <TopListenCard key={track.id}>
                <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ color: 'text.secondary', mr: 2, minWidth: '28px' }}>
                      {index + 1}
                    </Typography>
                    <Box>
                      <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                        {track.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {track.artist}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {track.plays?.toLocaleString()} plays
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </TopListenCard>
            ))}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReleasesPage;
