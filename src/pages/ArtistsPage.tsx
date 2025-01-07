import React, { useEffect, useState } from 'react';
import { Box, Grid, Card, CardMedia, CardContent, Typography, FormControl, InputLabel, Select, MenuItem, CircularProgress, Container, IconButton, Collapse, Button } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { RecordLabel, RECORD_LABELS } from '../constants/labels';
import { databaseService } from '../services/DatabaseService';
import { Artist } from '../types/artist';
import { FaSpotify } from 'react-icons/fa';
import { Release } from '../types/release';

const ArtistCard: React.FC<{ artist: Artist }> = ({ artist }) => {
  const [showReleases, setShowReleases] = useState(false);
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadReleases = async () => {
      if (showReleases && artist.id) {
        setLoading(true);
        try {
          const artistReleases = await databaseService.getReleasesByArtistId(artist.id);
          setReleases(artistReleases);
        } catch (error) {
          console.error('Error loading releases:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadReleases();
  }, [showReleases, artist.id]);

  return (
    <Card sx={{ 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      transition: 'transform 0.2s',
      '&:hover': {
        transform: 'scale(1.02)'
      }
    }}>
      <CardMedia
        component="img"
        height="200"
        image={artist.images?.[0]?.url || '/placeholder-artist.jpg'}
        alt={artist.name}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h6" component="div" gutterBottom>
          {artist.name}
        </Typography>
        {artist.spotify_url && (
          <IconButton
            href={artist.spotify_url}
            target="_blank"
            rel="noopener noreferrer"
            color="primary"
          >
            <FaSpotify />
          </IconButton>
        )}

        <Button
          onClick={() => setShowReleases(!showReleases)}
          variant="outlined"
          size="small"
          fullWidth
          sx={{ mt: 2 }}
        >
          {showReleases ? 'Hide Releases' : 'Show Releases'}
        </Button>

        <Collapse in={showReleases}>
          <Box sx={{ mt: 2 }}>
            {loading ? (
              <CircularProgress size={20} />
            ) : releases.length > 0 ? (
              releases.map((release) => (
                <Box
                  key={release.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 2,
                    p: 1,
                    borderRadius: 1,
                    bgcolor: 'background.paper',
                    boxShadow: 1
                  }}
                >
                  <CardMedia
                    component="img"
                    sx={{ width: 60, height: 60, borderRadius: 1, mr: 2 }}
                    image={release.images?.[0]?.url || '/placeholder-release.jpg'}
                    alt={release.name}
                  />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle2" noWrap>
                      {release.name}
                    </Typography>
                    {release.release_date && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {new Date(release.release_date).toLocaleDateString()}
                      </Typography>
                    )}
                    {release.external_urls?.spotify && (
                      <IconButton
                        href={release.external_urls.spotify}
                        target="_blank"
                        rel="noopener noreferrer"
                        size="small"
                        sx={{ padding: 0.5 }}
                      >
                        <FaSpotify fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </Box>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary" align="center">
                No releases found
              </Typography>
            )}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

const ArtistsPage: React.FC = () => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<string>('buildit-records');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const loadArtists = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedArtists = await databaseService.getArtistsForLabel(selectedLabel);
        setArtists(fetchedArtists);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load artists');
        setArtists([]);
      } finally {
        setLoading(false);
      }
    };

    loadArtists();
  }, [selectedLabel]);

  const handleLabelChange = (event: any) => {
    const newLabel = event.target.value;
    setSelectedLabel(newLabel);
    navigate(`/records/artists?label=${newLabel}`);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box mb={4}>
        <FormControl fullWidth>
          <InputLabel id="label-select-label">Label</InputLabel>
          <Select
            labelId="label-select-label"
            value={selectedLabel}
            label="Label"
            onChange={handleLabelChange}
          >
            {Object.entries(RECORD_LABELS).map(([id, label]) => (
              <MenuItem key={id} value={id}>
                {label.displayName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {artists.length === 0 ? (
        <Typography variant="h6" textAlign="center" color="text.secondary">
          No artists found for this label
        </Typography>
      ) : (
        <Grid container spacing={4}>
          {artists.map((artist) => (
            <Grid item key={artist.id} xs={12} sm={6} md={4} lg={3}>
              <ArtistCard artist={artist} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default ArtistsPage;
