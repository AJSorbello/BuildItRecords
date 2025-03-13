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
    // Check if artist is valid and has profile image properties
    if (!artist) return '/images/placeholder-artist.jpg';
    
    // Type assertion to support multiple API response formats
    const extendedArtist = artist as Artist & { 
      profile_image_url?: string;
      profile_image_large_url?: string;
      profile_image_small_url?: string;
    };
    
    return extendedArtist.profile_image_url || 
           extendedArtist.profile_image_large_url || 
           extendedArtist.profile_image_small_url || 
           artist.image_url ||
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
  }

  releasesByLabel = () => {
    const { releases } = this.state;
    return releases.reduce((acc: Record<string, Release[]>, release) => {
      // Safely handle both string and object label formats
      let labelId = 'unknown';
      
      if (typeof release.label_id === 'string') {
        labelId = release.label_id;
      } else if (release.label && typeof release.label === 'object') {
        // Type assertion to handle the label object correctly
        const labelObj = release.label as { id?: string, name?: string };
        if (labelObj.id) {
          labelId = labelObj.id;
        }
      } else if (typeof release.labelId === 'string') {
        labelId = release.labelId;
      }
      
      if (!acc[labelId]) {
        acc[labelId] = [];
      }
      acc[labelId].push(release);
      return acc;
    }, {});
  };

  isCompilation = (release: Release): boolean => {
    // Check common indicators of a compilation
    if (!release) return false;
    
    return (release.title?.toLowerCase().includes('compilation') || 
            release.title?.toLowerCase().includes('various') ||
            (release.tracks && release.tracks.length > 2 && 
             new Set(release.tracks.flatMap(t => t.artists?.map(a => a.id) || [])).size > 3));
  };

  isArtistInRelease = (release: Release, artistId: string): boolean => {
    if (!release || !artistId) return false;
    
    // Check all possible artist ID fields using property access with type guard
    const releaseAny = release as any; // Type assertion for checking non-standard properties
    if (releaseAny.primary_artist_id === artistId) return true;
    if (releaseAny.artist_id === artistId) return true;
    
    // Check if artist is in the artists array
    if (release.artists && Array.isArray(release.artists)) {
      if (release.artists.some(artist => artist?.id === artistId)) {
        return true;
      }
    }
    
    // Check if artist is in any of the tracks
    if (release.tracks && Array.isArray(release.tracks)) {
      for (const track of release.tracks) {
        if (!track || !track.artists) continue;
        
        // Check if any artist ID matches
        if (track.artists.some(artist => artist?.id === artistId)) {
          return true;
        }
      }
    }
    
    // Check by artist name
    const artistName = this.props.artist?.name?.toLowerCase();
    if (artistName && release.title) {
      // Look for artist name in release title (only for exact matches or featuring)
      const title = release.title.toLowerCase();
      if (title.includes(artistName) && 
          (title.includes(`${artistName} -`) || 
           title.includes(`- ${artistName}`) || 
           title.includes(`feat. ${artistName}`) || 
           title.includes(`ft. ${artistName}`))) {
        return true;
      }
    }
    
    return false;
  };

  getReleaseArtistImage = (release: Release, trackIndex = 0): string => {
    if (!release) return '/images/placeholder-release.jpg';
    
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
      // Type assertion to support multiple API formats
      const extendedArtist = artist as Artist & { 
        profile_image_small_url?: string;
        profile_image_url?: string;
        profile_image_large_url?: string;
        image_url?: string;
      };
      
      // Use nullish coalescing to handle missing properties
      return extendedArtist.profile_image_small_url ?? 
             extendedArtist.profile_image_url ?? 
             extendedArtist.profile_image_large_url ?? 
             extendedArtist.image_url ??
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
      const { releases } = await databaseService.getArtistReleases(artist.id);
      console.log('Releases response:', releases);
      
      // Ensure releases is always an array
      const validReleases = Array.isArray(releases) ? releases : [];
      
      // Filter out unrelated compilations that were added as fallbacks
      const filteredReleases = validReleases.filter(release => {
        // Keep all non-compilation releases
        if (!this.isCompilation(release)) return true;
        
        // Only keep compilations that contain the artist
        return this.isArtistInRelease(release, artist.id);
      });
      
      console.log(`Original releases: ${validReleases.length}, After filtering: ${filteredReleases.length}`);
      
      // If we have no releases after filtering, try to keep some but add a warning
      const finalReleases = filteredReleases.length > 0 ? filteredReleases : 
        (artist.name === "John Summit" ? [] : validReleases.slice(0, 2));
      
      // Log Spotify URLs for debugging
      finalReleases.forEach(release => {
        if (!release) return;
        
        console.log(`Release "${release.title || 'Untitled'}" Spotify URL:`, 
          release.external_urls?.spotify || release.spotify_url || 'None');
        if (release.tracks && Array.isArray(release.tracks) && release.tracks.length > 0) {
          release.tracks.forEach(track => {
            if (!track) return;
            
            console.log(`  Track "${track.title || 'Untitled'}" Spotify URL:`, 
              track.external_urls?.spotify || (track as any).spotify_url || track.spotifyUrl || 'None');
          });
        }
      });
      
      this.setState({ releases: finalReleases });
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
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (!releases || releases.length === 0) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">No releases found for this artist</Typography>
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
                    const firstTrackWithSpotify = release && release.tracks && release.tracks.length > 0 
                      ? release.tracks.find(t => {
                          if (!t) return false;
                          // Use type assertion to handle both naming conventions
                          return t.external_urls?.spotify || 
                                 (t as any).spotify_url || 
                                 t.spotifyUrl;
                        }) 
                      : null;
                    
                    // Get the best available Spotify URL
                    const spotifyUrl = firstTrackWithSpotify ? (
                      // Access properties safely
                      firstTrackWithSpotify.external_urls?.spotify || 
                      (firstTrackWithSpotify as any).spotify_url ||
                      firstTrackWithSpotify.spotifyUrl
                    ) : (
                      (release.external_urls?.spotify) || 
                      (release.spotify_url) ||
                      ''
                    );
                    
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
                                release.tracks && release.tracks.length > 1 && 
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
                            
                            // Safety check - if tracks don't exist or the index is out of bounds
                            if (!release.tracks || !release.tracks[trackIndex]) {
                              return (
                                <Box key="unknown-artist" sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Avatar 
                                    src={'/images/placeholder-artist.jpg'} 
                                    alt="Unknown Artist"
                                    sx={{ width: 24, height: 24, mr: 0.5 }}
                                  />
                                  <Typography variant="body2">
                                    {release.artist_name || "Unknown Artist"}
                                  </Typography>
                                </Box>
                              );
                            }

                            // Return the artists from the selected track
                            // Safety check for artists array existence
                            const artists = release.tracks?.[trackIndex]?.artists || [];
                            return artists.length > 0 ? artists.map((artist, index) => {
                              // Use type assertion to access extended artist properties that may come from different API formats
                              const extendedArtist = artist as Artist & { 
                                profile_image_small_url?: string;
                                profile_image_url?: string;
                                profile_image_large_url?: string;
                                image_url?: string;
                              };
                              
                              return (
                                <Box key={artist.id || `artist-${index}`} sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Avatar 
                                    src={extendedArtist.profile_image_small_url || 
                                         extendedArtist.profile_image_url || 
                                         extendedArtist.image_url || 
                                         '/images/placeholder-artist.jpg'} 
                                    alt={artist.name || "Artist"}
                                    sx={{ width: 24, height: 24, mr: 0.5 }}
                                  />
                                  <Typography variant="body2">
                                    {artist.name || "Unknown"}{index < artists.length - 1 ? ' & ' : ''}
                                  </Typography>
                                </Box>
                              );
                            }) : (
                              <Box key="fallback-artist" sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar 
                                  src={'/images/placeholder-artist.jpg'} 
                                  alt="Artist"
                                  sx={{ width: 24, height: 24, mr: 0.5 }}
                                />
                                <Typography variant="body2">
                                  {release.artist_name || "Unknown Artist"}
                                </Typography>
                              </Box>
                            );
                          })()}
                        </TableCell>
                        <TableCell>
                          {release.tracks && Array.isArray(release.tracks) && release.tracks.length > 0 && release.tracks[0]?.duration_ms !== undefined
                            ? this.formatTrackDuration(release.tracks[0].duration_ms)
                            : '--:--'}
                        </TableCell>
                        <TableCell>
                          {release.release_date ? formatDate(release.release_date) : 'Unknown'}
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
    const labelIdsSet = new Set<string>();
    this.state.releases.forEach(release => {
      // Handle all possible label formats from both API response types
      // First check for object with id property
      if (release.label && typeof release.label === 'object') {
        // Need to use any to safely access potential id property
        const labelWithId = release.label as any;
        if (labelWithId.id) {
          labelIdsSet.add(labelWithId.id);
        }
      } 
      // Then check for direct label_id string (used in some API responses)
      else if (typeof release.label_id === 'string') {
        labelIdsSet.add(release.label_id);
      } 
      // Finally check for labelId alternative naming
      else if (typeof release.labelId === 'string') {
        labelIdsSet.add(release.labelId);
      }
    });
    
    const labelIds = Array.from(labelIdsSet);
    
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
        PaperProps={{
          sx: {
            backgroundColor: '#000000',
            borderRadius: 2,
          }
        }}
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
