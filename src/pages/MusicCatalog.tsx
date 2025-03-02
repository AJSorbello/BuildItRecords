import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Tab,
  Tabs,
  Paper,
  Grid,
  useTheme
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useLocation } from 'react-router-dom';
import { useSpotifySearch } from '../hooks/useSpotifySearch';
import { useSpotifyArtist } from '../hooks/useSpotifyArtist';
import { useSpotifyTracks } from '../hooks/useSpotifyTracks';
import { ArtistProfile } from '../components/ArtistProfile';
import { TrackList } from '../components/TrackList';
import { TrackDetails } from '../components/TrackDetails';
import { Track } from '../types/track';
import { labelColors } from '../theme/theme';

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
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const MusicCatalog: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);

  const theme = useTheme();
  const location = useLocation();

  const pathParts = location.pathname.split('/');
  const currentPath = pathParts[1]?.toLowerCase() || 'records';

  const labelColor = labelColors[currentPath as keyof typeof labelColors] || labelColors.records;

  const { tracks, artists, loading, error } = useSpotifySearch(
    searchQuery,
    ['track', 'artist'],
    { limit: 20 }
  );

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleTrackClick = (track: Track) => {
    setSelectedTrack(track);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Music Catalog
      </Typography>

      <TextField
        fullWidth
        label="Search for tracks or artists"
        variant="outlined"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ 
          mb: 4,
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
            bgcolor: 'background.paper',
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.23)'
            },
            '&:hover fieldset': {
              borderColor: `${alpha(labelColor, 0.5)}`
            },
            '&.Mui-focused fieldset': {
              borderColor: labelColor
            }
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: labelColor
          },
          '& .MuiInputBase-input': {
            color: '#ffffff'
          }
        }}
      />

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Paper sx={{ width: '100%', mb: 4 }}>
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          aria-label="music catalog tabs"
        >
          <Tab label={`Tracks (${tracks.length})`} />
          <Tab label={`Artists (${artists.length})`} />
        </Tabs>

        <TabPanel value={selectedTab} index={0}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={selectedTrack ? 6 : 12}>
              <TrackList
                tracks={tracks}
                loading={loading}
                onTrackClick={handleTrackClick}
              />
            </Grid>
            {selectedTrack && (
              <Grid item xs={12} md={6}>
                <TrackDetails track={selectedTrack} />
              </Grid>
            )}
          </Grid>
        </TabPanel>

        <TabPanel value={selectedTab} index={1}>
          <Grid container spacing={4}>
            {artists.map((artist) => (
              <Grid item key={artist.id} xs={12}>
                <ArtistProfile artistId={artist.id} />
              </Grid>
            ))}
          </Grid>
        </TabPanel>
      </Paper>
    </Container>
  );
};
