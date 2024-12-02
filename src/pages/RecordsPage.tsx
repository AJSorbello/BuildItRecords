import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, CardMedia, Link, styled } from '@mui/material';
import { FaSpotify, FaSoundcloud } from 'react-icons/fa';
import { SiBeatport } from 'react-icons/si';
import PageLayout from '../components/PageLayout';
import { Track } from '../types/track';
import { getTracksByLabel } from '../utils/trackUtils';
import { RECORD_LABELS } from '../constants/labels';
import { getArtistsByLabel } from '../utils/artistUtils';
import { Artist } from '../data/mockData';
import TrackList from '../components/TrackList';

const IconLink = styled(Link)({
  color: '#FFFFFF',
  marginRight: '16px',
  '&:hover': {
    color: '#02FF95',
  },
});

const ArtistCard = styled(Card)({
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

const RecordsPage = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [pastReleases, setPastReleases] = useState<any[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);

  useEffect(() => {
    setTracks(getTracksByLabel(RECORD_LABELS.RECORDS));
    setArtists(getArtistsByLabel(RECORD_LABELS.RECORDS));
    setPastReleases([
      {
        id: '1',
        title: 'Release 1',
        artist: 'Artist 1',
        catalogNumber: 'BIR001',
        genre: 'House',
        style: 'Deep House'
      },
      // Add more mock releases as needed
    ]);
    setPlaylists([
      {
        id: '1',
        title: 'Playlist 1',
        description: 'Our latest tracks',
        url: 'https://spotify.com/playlist1'
      },
      // Add more mock playlists as needed
    ]);
  }, []);

  return (
    <PageLayout label="records">
      <Box sx={{ maxWidth: 1200, margin: '0 auto', padding: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#FFFFFF', mb: 4 }}>
          Records Releases
        </Typography>
        
        <Box mb={6}>
          <TrackList tracks={tracks} />
        </Box>

        <Box mb={6}>
          <Typography variant="h5" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
            Past Releases
          </Typography>
          <Grid container spacing={3} justifyContent="center">
            {pastReleases.map((release) => (
              <Grid item xs={12} sm={6} md={3} key={release.id}>
                <Card sx={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', transition: 'transform 0.2s', height: '100%', display: 'flex', flexDirection: 'column', '&:hover': { transform: 'scale(1.02)', backgroundColor: 'rgba(255, 255, 255, 0.08)' } }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="body1" component="div" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                      {release.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {release.artist}
                    </Typography>
                    <Box mt={1}>
                      <Typography variant="caption" color="text.secondary">
                        {release.catalogNumber}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {release.genre} {release.style ? `- ${release.style}` : ''}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Box mb={6}>
          <Typography variant="h5" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
            Playlists
          </Typography>
          <Grid container spacing={3} justifyContent="center">
            {playlists.map((playlist) => (
              <Grid item xs={12} sm={6} key={playlist.id}>
                <Card sx={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', transition: 'transform 0.2s', height: '100%', display: 'flex', flexDirection: 'column', '&:hover': { transform: 'scale(1.02)', backgroundColor: 'rgba(255, 255, 255, 0.08)' } }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      {playlist.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {playlist.description}
                    </Typography>
                    <Box mt={2}>
                      <IconLink href={playlist.url} target="_blank" rel="noopener noreferrer">
                        <FaSpotify size={24} />
                      </IconLink>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Box>
          <Typography variant="h5" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
            Artists
          </Typography>
          <Grid container spacing={3} justifyContent="center">
            {artists.map((artist) => (
              <Grid item xs={12} sm={6} md={4} key={artist.id}>
                <ArtistCard>
                  <CardMedia
                    component="img"
                    height="200"
                    image={artist.imageUrl || 'https://via.placeholder.com/300x300.png?text=' + encodeURIComponent(artist.name)}
                    alt={artist.name}
                    sx={{
                      objectFit: 'cover',
                      transition: 'transform 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'scale(1.05)'
                      }
                    }}
                  />
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ color: '#FFFFFF' }}>
                      {artist.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#AAAAAA', mb: 2 }}>
                      {artist.bio}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <IconLink href={artist.spotifyUrl} target="_blank" rel="noopener noreferrer">
                        <FaSpotify size={24} />
                      </IconLink>
                      <IconLink href={artist.beatportUrl} target="_blank" rel="noopener noreferrer">
                        <SiBeatport size={24} />
                      </IconLink>
                      <IconLink href={artist.soundcloudUrl} target="_blank" rel="noopener noreferrer">
                        <FaSoundcloud size={24} />
                      </IconLink>
                    </Box>
                  </CardContent>
                </ArtistCard>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>
    </PageLayout>
  );
};

export default RecordsPage;
