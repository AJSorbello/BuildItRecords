import React from 'react';
import { Box, Typography, Grid, Tabs, Tab } from '@mui/material';
import { ReleaseCard } from './ReleaseCard';
import { ArtistCard } from './ArtistCard';
import { useSpotifyArtist } from '../hooks/useSpotifyArtist';
import { Artist, ArtistDetails } from '../types/artist';
import { Track } from '../types/track';
import { Album } from '../types/album';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`artist-tabpanel-${index}`}
      aria-labelledby={`artist-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

interface ArtistProfileProps {
  artistId: string;
}

export const ArtistProfile: React.FC<ArtistProfileProps> = ({ artistId }) => {
  const [tabValue, setTabValue] = React.useState(0);
  const { artist, isLoading, error } = useSpotifyArtist(artistId);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!artist) return <ErrorMessage message="Artist not found" />;

  const artistDetails = artist as ArtistDetails;

  return (
    <Box>
      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <ArtistCard artist={artist} />
          <Box sx={{ mt: 2 }}>
            {artist.followers && (
              <Typography variant="body2" color="text.secondary">
                {artist.followers.total.toLocaleString()} followers
              </Typography>
            )}
            {artist.genres && artist.genres.length > 0 && (
              <Typography variant="body2" color="text.secondary">
                Genres: {artist.genres.join(', ')}
              </Typography>
            )}
          </Box>
        </Grid>
        <Grid item xs={12} md={8}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="artist content tabs">
              <Tab label="Top Tracks" />
              <Tab label="Albums" />
              <Tab label="Related Artists" />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            {artistDetails.topTracks?.items && (
              <Grid container spacing={2}>
                {artistDetails.topTracks.items.map((track, index) => (
                  <Grid item xs={12} sm={6} md={4} key={track.id}>
                    <ReleaseCard
                      track={{
                        ...track,
                        artists: [artist],
                        type: 'track',
                        external_ids: {},
                        track_number: 0,
                        disc_number: 0,
                        isrc: '',
                        images: track.album.images
                      }}
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {artistDetails.albums?.items && (
              <Grid container spacing={2}>
                {artistDetails.albums.items.map((album, index) => (
                  <Grid item xs={12} sm={6} md={4} key={album.id}>
                    <ReleaseCard
                      track={{
                        id: album.id,
                        name: album.name,
                        artists: [artist],
                        album: {
                          id: album.id,
                          name: album.name,
                          artists: [artist],
                          images: album.images,
                          release_date: album.release_date,
                          total_tracks: album.total_tracks,
                          type: album.type,
                          external_urls: album.external_urls,
                          uri: ''
                        },
                        duration_ms: 0,
                        preview_url: null,
                        external_urls: album.external_urls,
                        uri: '',
                        type: 'track',
                        track_number: 0,
                        disc_number: 0,
                        isrc: '',
                        images: album.images,
                        external_ids: {}
                      }}
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            {artistDetails.relatedArtists && (
              <Grid container spacing={2}>
                {artistDetails.relatedArtists.map((relatedArtist, index) => (
                  <Grid item xs={12} sm={6} md={4} key={relatedArtist.id}>
                    <ArtistCard artist={relatedArtist} />
                  </Grid>
                ))}
              </Grid>
            )}
          </TabPanel>
        </Grid>
      </Grid>
    </Box>
  );
};
