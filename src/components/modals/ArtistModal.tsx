import React, { Component } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogTitle,
  Box,
  Typography,
  IconButton,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Link,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Chip,
  Grid,
  Divider,
  Avatar,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  Modal
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import InfoIcon from '@mui/icons-material/Info';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { databaseService } from '../../services/DatabaseService';
import { formatDate } from '../../utils/dateUtils';
import { Artist, Label, Release, Track } from '../../types';

interface ArtistModalProps {
  artist: Artist;
  open: boolean;
  onClose: () => void;
  fullScreen?: boolean;
  label?: string;
}

interface ArtistModalState {
  tracks: Track[];
  releases: Release[];
  loading: boolean;
  releasesLoading: boolean;
  activeTab: string;
  selectedTrackId: string | null;
  labels: any[];
}

const ArtistModalWrapper = (props: ArtistModalProps) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  
  return <ArtistModalClass {...props} fullScreen={fullScreen} />;
};

class ArtistModalClass extends Component<ArtistModalProps, ArtistModalState> {
  constructor(props: ArtistModalProps) {
    super(props);
    this.state = {
      tracks: [],
      releases: [],
      loading: false,
      releasesLoading: false,
      activeTab: 'releases',
      selectedTrackId: null,
      labels: []
    };
  }

  componentDidMount() {
    this.fetchReleases();
  }

  componentDidUpdate(prevProps: ArtistModalProps) {
    if (prevProps.artist?.id !== this.props.artist?.id) {
      this.fetchReleases();
    }
  }

  formatTrackDuration = (ms: number): string => {
    if (!ms || isNaN(ms)) {
      return '0:00';
    }
    
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    
    return `${minutes}:${seconds}`;
  };

  getArtistImage = (artist: Artist) => {
    return artist.profile_image_url || 
           artist.profile_image_large_url || 
           artist.profile_image_small_url || 
           '/images/placeholder-artist.jpg';
  };

  formatLabelName = (labelId: string) => {
    if (!labelId) return 'Unknown Label';
    
    const label = labelId.startsWith('buildit-') 
      ? labelId.replace('buildit-', 'Build It ').replace(/^\w/, c => c.toUpperCase())
      : labelId === 'unknown' ? 'Unknown Label' : labelId;
    return label;
  };

  tracksByLabel = () => {
    const { tracks } = this.state;
    return tracks.reduce((acc: Record<string, Track[]>, track) => {
      const labelId = track.release?.label_id || 'unknown';
      if (!acc[labelId]) {
        acc[labelId] = [];
      }
      acc[labelId].push(track);
      return acc;
    }, {});
  };

  async fetchReleases() {
    const { artist } = this.props;
    if (!artist?.id) return;
    
    this.setState({ releasesLoading: true });
    
    try {
      console.log(`Fetching releases for artist: ${artist.name} (${artist.id})`);
      const releases = await databaseService.getReleasesByArtist(artist.id);
      console.log('Releases response:', releases);
      this.setState({ releases });
    } catch (error) {
      console.error('Error fetching artist releases:', error);
    } finally {
      this.setState({ releasesLoading: false });
    }
  }

  releasesByLabel = () => {
    const { releases } = this.state;
    return releases.reduce((acc: Record<string, Release[]>, release) => {
      const labelId = release.label_id || release.label?.id || 'unknown';
      if (!acc[labelId]) {
        acc[labelId] = [];
      }
      acc[labelId].push(release);
      return acc;
    }, {});
  };

  renderReleases() {
    const { releases, releasesLoading } = this.state;
    
    if (releasesLoading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" py={4}>
          <CircularProgress />
        </Box>
      );
    }

    if (!releases || releases.length === 0) {
      return (
        <Box textAlign="center" py={4}>
          <Typography variant="body1" color="textSecondary">
            No releases found for this artist
          </Typography>
        </Box>
      );
    }

    const releasesByLabelObj = this.releasesByLabel();
    
    return (
      <Box>
        {Object.entries(releasesByLabelObj).map(([labelId, labelReleases]) => (
          <Box key={labelId} sx={{ mb: 4 }}>
            <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
              {this.formatLabelName(labelId)} ({labelReleases.length})
            </Typography>
            
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 3, borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Artists</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Released</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {labelReleases.map((release) => (
                    <TableRow key={release.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {release.artwork_url && (
                            <Avatar
                              src={release.artwork_url}
                              alt={release.title}
                              variant="rounded"
                              sx={{ width: 40, height: 40, mr: 1 }}
                            />
                          )}
                          <Box>
                            <Typography variant="body2" component="div" fontWeight="bold">
                              {release.title}
                            </Typography>
                            {release.catalog_number && (
                              <Typography variant="caption" color="text.secondary">
                                Cat: {release.catalog_number}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {release.tracks && release.tracks.length > 0 && release.tracks[0].artists && 
                          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
                            {release.tracks[0].artists.map((artist, index) => (
                              <Box key={artist.id} sx={{ display: 'flex', alignItems: 'center' }}>
                                {artist.profile_image_small_url && (
                                  <Avatar 
                                    src={artist.profile_image_small_url} 
                                    alt={artist.name}
                                    sx={{ width: 24, height: 24, mr: 0.5 }}
                                  />
                                )}
                                <Typography variant="body2">
                                  {artist.name}{index < release.tracks[0].artists.length - 1 ? ' & ' : ''}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        }
                      </TableCell>
                      <TableCell>
                        {release.tracks && release.tracks.length > 0 && 
                          this.formatTrackDuration(release.tracks[0].duration_ms)}
                      </TableCell>
                      <TableCell>
                        {formatDate(release.release_date)}
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                          {release.spotify_url && (
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => window.open(release.spotify_url, '_blank')}
                              title="Play on Spotify"
                            >
                              <MusicNoteIcon fontSize="small" />
                            </IconButton>
                          )}
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => window.open(`/releases/${release.id}`, '_blank')}
                            title="View Details"
                          >
                            <InfoIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        ))}
      </Box>
    );
  }

  renderLabels() {
    const labelIdsSet = new Set();
    this.state.releases.forEach(release => {
      if (release.label_id) labelIdsSet.add(release.label_id);
    });
    
    const labelIds = Array.from(labelIdsSet) as string[];
    
    if (labelIds.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary">
          No labels found
        </Typography>
      );
    }
    
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {labelIds.map(labelId => (
          <Chip 
            key={labelId} 
            label={this.formatLabelName(labelId)} 
            color="primary" 
            variant="outlined" 
            size="small"
          />
        ))}
      </Box>
    );
  }

  render() {
    const { open, onClose, artist } = this.props;
    if (!artist) return null;

    return (
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h5">{artist.name}</Typography>
            <IconButton onClick={onClose} size="large">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box display="flex" mb={4}>
            <Box mr={3}>
              <img 
                src={this.getArtistImage(artist)} 
                alt={artist.name}
                style={{ 
                  width: 260, 
                  height: 'auto', 
                  borderRadius: 8,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
              />
              <Box mt={2}>
                <Typography variant="h6">About the Artist</Typography>
                {artist.spotify_id && (
                  <Link 
                    href={`https://open.spotify.com/artist/${artist.spotify_id}`} 
                    target="_blank"
                    rel="noopener noreferrer"
                    color="primary"
                    underline="hover"
                    sx={{ display: 'inline-block', mt: 1 }}
                  >
                    Listen on Spotify
                  </Link>
                )}
              </Box>
              <Box mt={2}>
                <Typography variant="h6">Labels</Typography>
                {this.renderLabels()}
              </Box>
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              {this.renderReleases()}
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }
}

export default ArtistModalWrapper;
