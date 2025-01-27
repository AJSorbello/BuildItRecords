import React from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Grid,
  Tabs,
  Tab,
} from '@mui/material';
import { ReleaseCard } from './ReleaseCard';
import { useSpotifySearch } from '../hooks/useSpotifySearch';
import { Track } from '../types/track';
import { Artist } from '../types/artist';
import { Album } from '../types/release';

interface SearchResultsProps {
  query: string;
  onSelect?: (item: Track | Artist | Album) => void;
}

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
      id={`search-tabpanel-${index}`}
      aria-labelledby={`search-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  query,
  onSelect,
}) => {
  const [tabValue, setTabValue] = React.useState(0);
  const { tracks, artists, albums, loading, error } = useSpotifySearch(
    query,
    ['track', 'artist', 'album'],
    { limit: 20 }
  );

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!query) {
    return (
      <Box p={4}>
        <Typography color="textSecondary">
          Enter a search term to find music
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="search results tabs"
        >
          <Tab label={`Tracks (${tracks.length})`} />
          <Tab label={`Artists (${artists.length})`} />
          <Tab label={`Albums (${albums.length})`} />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {tracks.map((track) => (
            <Grid item xs={12} sm={6} md={4} key={track.id}>
              <ReleaseCard
                track={track}
                onClick={() => onSelect?.(track)}
              />
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          {artists.map((artist) => (
            <Grid item xs={12} sm={6} md={4} key={artist.id}>
              <ReleaseCard
                release={{
                  id: artist.id,
                  title: artist.name,
                  type: 'artist',
                  artist: artist.name,
                  artwork: artist.images?.[0]?.url,
                  spotifyUrl: artist.spotifyUrl,
                }}
                onClick={() => onSelect?.(artist)}
              />
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          {albums.map((album) => (
            <Grid item xs={12} sm={6} md={4} key={album.id}>
              <ReleaseCard
                release={{
                  id: album.id,
                  title: album.name,
                  type: album.type,
                  artist: album.artists[0]?.name || 'Unknown Artist',
                  artwork: album.images?.[0]?.url,
                  spotifyUrl: album.spotifyUrl,
                }}
                onClick={() => onSelect?.(album)}
              />
            </Grid>
          ))}
        </Grid>
      </TabPanel>
    </Box>
  );
};
