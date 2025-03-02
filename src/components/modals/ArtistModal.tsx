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
import { Artist } from '../../types/artist';
import { Release } from '../../types/release';
import { Track } from '../../types/track';
import { RecordLabelId } from '../../types/labels';

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
      const labelId = track.release?.label?.id || 'unknown';
      if (!acc[labelId]) {
        acc[labelId] = [];
      }
      acc[labelId].push(track);
      return acc;
    }, {});
  };

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

  isCompilation = (release: Release): boolean => {
    // Check common indicators of a compilation
    return (release.title?.toLowerCase().includes('compilation') || 
            release.title?.toLowerCase().includes('various') ||
            (release.tracks && release.tracks.length > 2 && 
             new Set(release.tracks.flatMap(t => t.artists?.map(a => a.id) || [])).size > 3));
  };

  getReleaseArtistImage = (release: Release, trackIndex: number = 0): string => {
    if (this.isCompilation(release)) {
      // For compilations, use the album artwork
      return release.artwork_url || '/images/placeholder-release.jpg';
    }

    // For normal releases, try to get the artist image
    if (release.tracks && 
        release.tracks.length > trackIndex && 
        release.tracks[trackIndex].artists && 
        release.tracks[trackIndex].artists.length > 0) {
      const artist = release.tracks[trackIndex].artists[0];
      return artist.profile_image_small_url || 
             artist.profile_image_url || 
             artist.profile_image_large_url || 
             '/images/placeholder-artist.jpg';
    }

    return '/images/placeholder-artist.jpg';
  };

  async fetchReleases() {
    const { artist } = this.props;
    if (!artist?.id) return;
    
    this.setState({ releasesLoading: true });
    
    try {
      console.log(`Fetching releases for artist: ${artist.name} (${artist.id})`);
      const releases = await databaseService.getReleasesByArtist(artist.id);
      console.log('Releases response:', releases);
      
      // Log Spotify URLs for debugging
      releases.forEach(release => {
        console.log(`Release "${release.title}" Spotify URL:`, 
          release.external_urls?.spotify || release.spotify_url || 'None');
        if (release.tracks && release.tracks.length > 0) {
          release.tracks.forEach(track => {
            console.log(`  Track "${track.title}" Spotify URL:`, 
              track.external_urls?.spotify || track.spotify_url || 'None');
          });
        }
      });
      
      this.setState({ releases });
    } catch (error) {
      console.error('Error fetching artist releases:', error);
    } finally {
      this.setState({ releasesLoading: false });
    }
  }

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
                    <TableCell align="center">Play</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {labelReleases.map((release) => {
                    // Extract track with Spotify URL if available
                    const firstTrackWithSpotify = release.tracks && release.tracks.length > 0 
                      ? release.tracks.find(t => t.spotify_url || t.external_urls?.spotify) 
                      : null;
                    
                    // Get the best available Spotify URL
                    const spotifyUrl = 
                      (firstTrackWithSpotify?.external_urls?.spotify) || 
                      (firstTrackWithSpotify?.spotify_url) ||
                      (release.external_urls?.spotify) || 
                      (release.spotify_url) ||
                      '';
                      
                    return (
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
                          {(() => {
                            // Determine which track to use for artist info
                            let trackIndex = 0;
                            // For compilations, use track at index 1 if available
                            if ((release.title && release.title.toLowerCase().includes('compilation')) && 
                                release.tracks.length > 1 && 
                                release.tracks[1].artists && 
                                release.tracks[1].artists.length > 0) {
                              trackIndex = 1;
                            }
                            
                            // Check if this is a compilation album
                            const isCompilation = this.isCompilation(release);
                            
                            if (isCompilation) {
                              // For compilations, show "Various Artists" with the album artwork
                              return (
                                <Box key="various-artists" sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Avatar 
                                    src={release.artwork_url || '/images/placeholder-release.jpg'} 
                                    alt="Various Artists"
                                    sx={{ width: 24, height: 24, mr: 0.5 }}
                                  />
                                  <Typography variant="body2">
                                    Various Artists
                                  </Typography>
                                </Box>
                              );
                            }
                            
                            // Return the artists from the selected track
                            return release.tracks[trackIndex].artists?.map((artist, index) => (
                              <Box key={artist.id} sx={{ display: 'flex', alignItems: 'center' }}>
                                {artist.profile_image_small_url && (
                                  <Avatar 
                                    src={artist.profile_image_small_url} 
                                    alt={artist.name}
                                    sx={{ width: 24, height: 24, mr: 0.5 }}
                                  />
                                )}
                                <Typography variant="body2">
                                  {artist.name}{index < release.tracks[trackIndex].artists.length - 1 ? ' & ' : ''}
                                </Typography>
                              </Box>
                            ));
                          })()}
                        </TableCell>
                        <TableCell>
                          {release.tracks && release.tracks.length > 0 && 
                            this.formatTrackDuration(release.tracks[0].duration_ms)}
                        </TableCell>
                        <TableCell>
                          {formatDate(release.release_date)}
                        </TableCell>
                        <TableCell align="center">
                          {spotifyUrl ? (
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => window.open(spotifyUrl, '_blank')}
                              title="Play on Spotify"
                            >
                              <PlayArrowIcon fontSize="small" />
                            </IconButton>
                          ) : (
                            <Typography variant="caption" color="text.secondary">N/A</Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
      if (release.label?.id) labelIdsSet.add(release.label.id);
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
                {artist.uri && (
                  <Link 
                    href={`https://open.spotify.com/artist/${artist.uri.split(':')[2]}`} 
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
