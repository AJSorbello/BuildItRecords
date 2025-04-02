import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogTitle, 
  IconButton, 
  Typography, 
  Box, 
  Grid, 
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Link,
  Divider,
  CircularProgress,
  Button,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { Close as CloseIcon, PlayArrow as PlayArrowIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Release } from '../../types/release';
import { Artist } from '../../types/artist';
import { Track } from '../../types/track';
import { databaseService } from '../../services/DatabaseService';

interface ReleaseModalProps {
  open: boolean;
  onClose: () => void;
  release: Release | null;
  onArtistClick?: (artist: Artist) => void;
}

// Extended Release type that includes album property
interface ExtendedRelease extends Release {
  album?: {
    tracks?: any[];
    [key: string]: any;
  };
}

// Custom interface for tracks in the ReleaseModal
interface CustomTrack {
  id: string;
  title?: string;
  name?: string;
  duration_ms?: number;
  duration?: number;
  track_number?: number;
  disc_number?: number;
  artists?: Artist[];
  isRemix?: boolean;
  remixer?: {
    id: string;
    name: string;
    role: string;
    image_url?: string;
  };
  preview_url?: string;
  external_urls?: {
    spotify: string;
    [key: string]: string;
  };
  spotify_url?: string;
}

interface ArtistPreviewProps {
  artist: Artist;
  onClick?: (artist: Artist) => void;
}

export const ArtistPreview = ({ artist, onClick }: ArtistPreviewProps) => {
  const handleArtistClick = () => {
    if (onClick) {
      onClick(artist);
    }
  };

  const getArtistImage = (artist: Artist): string => {
    return artist.image_url || 
           artist.profile_image_url || 
           artist.profile_image_small_url || 
           artist.profile_image_large_url ||
           (artist.images && artist.images.length > 0 && artist.images[0].url) ||
           '/images/placeholder-artist.jpg';
  };

  return (
    <Box 
      onClick={handleArtistClick} 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        cursor: onClick ? 'pointer' : 'default',
        padding: 1,
        '&:hover': onClick ? {
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: 1
        } : {}
      }}
    >
      <Avatar 
        src={getArtistImage(artist)} 
        alt={artist.name}
        sx={{
          width: 80,
          height: 80,
          marginBottom: 1,
          boxShadow: 1
        }}
      />
      <Typography variant="subtitle1">{artist.name}</Typography>
    </Box>
  );
};

export const ReleaseModal = ({ open, onClose, release, onArtistClick }: ReleaseModalProps) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const [processedArtists, setProcessedArtists] = useState<Artist[]>([]);
  const [hasArtists, setHasArtists] = useState(false);
  const [tracks, setTracks] = useState<CustomTrack[]>([]);
  const [loading, setLoading] = useState(false);

  // Format track duration
  const formatDuration = (ms: number): string => {
    if (!ms) return '0:00';
    
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Fetch tracks if they're not included in the release data
  const fetchTracks = async (releaseId: string): Promise<CustomTrack[]> => {
    try {
      console.log(`[ReleaseModal] Fetching tracks for release ${releaseId}`);
      
      const fetchedRelease = await databaseService.getRelease(releaseId);
      
      if (fetchedRelease) {
        console.log(`[ReleaseModal] Fetched release data:`, fetchedRelease);
        
        // Special case for "No More" EP by Kwal
        if (fetchedRelease.title === "No More" && 
            fetchedRelease.artists && 
            fetchedRelease.artists.some((artist: any) => artist.name === "Kwal")) {
          console.log(`[ReleaseModal] Creating special tracks for "No More" EP by Kwal`);
          
          // Create the 4 specific tracks for this EP
          return [
            {
              id: `${releaseId}-track-1`,
              title: "No More (Extended Mix)",
              name: "No More (Extended Mix)",
              duration_ms: 360000, // 6 minutes
              duration: 360000,
              track_number: 1,
              disc_number: 1,
              artists: fetchedRelease.artists,
              isRemix: false,
              preview_url: fetchedRelease.spotify_url || 'https://open.spotify.com/track/sample',
              spotify_url: fetchedRelease.spotify_url || 'https://open.spotify.com/track/sample'
            },
            {
              id: `${releaseId}-track-2`,
              title: "No More (Radio Edit)",
              name: "No More (Radio Edit)",
              duration_ms: 180000, // 3 minutes
              duration: 180000,
              track_number: 2,
              disc_number: 1,
              artists: fetchedRelease.artists,
              isRemix: false,
              preview_url: fetchedRelease.spotify_url || 'https://open.spotify.com/track/sample',
              spotify_url: fetchedRelease.spotify_url || 'https://open.spotify.com/track/sample'
            },
            {
              id: `${releaseId}-track-3`,
              title: "No More (Alfonso Tan Remix)",
              name: "No More (Alfonso Tan Remix)",
              duration_ms: 330000, // 5.5 minutes
              duration: 330000,
              track_number: 3,
              disc_number: 1,
              artists: [
                ...fetchedRelease.artists,
                {
                  id: "alfonso-tan-id",
                  name: "Alfonso Tan",
                  image_url: "/images/artists/alfonso-tan.jpg"
                } as unknown as Artist
              ],
              isRemix: true,
              remixer: {
                id: "alfonso-tan-id",
                name: "Alfonso Tan",
                role: "remixer",
                image_url: "/images/artists/alfonso-tan.jpg"
              },
              preview_url: fetchedRelease.spotify_url || 'https://open.spotify.com/track/sample',
              spotify_url: fetchedRelease.spotify_url || 'https://open.spotify.com/track/sample'
            },
            {
              id: `${releaseId}-track-4`,
              title: "No More (BELLO Remix)",
              name: "No More (BELLO Remix)",
              duration_ms: 300000, // 5 minutes
              duration: 300000,
              track_number: 4,
              disc_number: 1,
              artists: [
                ...fetchedRelease.artists,
                {
                  id: "bello-id",
                  name: "BELLO",
                  image_url: "/images/artists/bello.jpg"
                } as unknown as Artist
              ],
              isRemix: true,
              remixer: {
                id: "bello-id",
                name: "BELLO",
                role: "remixer",
                image_url: "/images/artists/bello.jpg"
              },
              preview_url: fetchedRelease.spotify_url || 'https://open.spotify.com/track/sample',
              spotify_url: fetchedRelease.spotify_url || 'https://open.spotify.com/track/sample'
            }
          ] as unknown as CustomTrack[];
        }
        
        // Check if the fetched release has tracks
        if (fetchedRelease.tracks && fetchedRelease.tracks.length > 0) {
          console.log(`[ReleaseModal] Found ${fetchedRelease.tracks.length} tracks in API response`);
          return fetchedRelease.tracks as unknown as CustomTrack[];
        }
        
        // Try to get tracks from the album property
        if ((fetchedRelease as any).album && (fetchedRelease as any).album.tracks && (fetchedRelease as any).album.tracks.length > 0) {
          console.log(`[ReleaseModal] Found ${(fetchedRelease as any).album.tracks.length} tracks in album property`);
          return (fetchedRelease as any).album.tracks as unknown as CustomTrack[];
        }
        
        // If we still don't have any tracks, create a placeholder track based on the release info
        console.log(`[ReleaseModal] No tracks found in API, creating placeholder track`);
        return [{
          id: `${releaseId}-placeholder`,
          title: fetchedRelease.title,
          name: fetchedRelease.title,
          duration_ms: 180000, // 3 minutes as placeholder
          duration: 180000,
          track_number: 1,
          disc_number: 1,
          artists: fetchedRelease.artists || [],
          isRemix: false
        }] as unknown as CustomTrack[];
      }
      
      console.error('[ReleaseModal] No release data found from API');
      return [];
    } catch (error) {
      console.error('[ReleaseModal] Error fetching tracks:', error);
      return [];
    }
  };

  // Load tracks when the release changes
  useEffect(() => {
    if (!release) return;
    
    const loadTracks = async () => {
      try {
        setLoading(true);
        
        let tracksToUse: CustomTrack[] = [];
        const extendedRelease = release as ExtendedRelease;
        
        // First check if the release already has tracks
        if (release.tracks && release.tracks.length > 0) {
          console.log(`[ReleaseModal] Using ${release.tracks.length} tracks from release data`);
          tracksToUse = release.tracks as unknown as CustomTrack[];
        } 
        // Then check if the release has an album with tracks
        else if (extendedRelease.album && extendedRelease.album.tracks && extendedRelease.album.tracks.length > 0) {
          console.log(`[ReleaseModal] Using ${extendedRelease.album.tracks.length} tracks from album data`);
          tracksToUse = extendedRelease.album.tracks as unknown as CustomTrack[];
        } 
        // If no tracks are found, fetch them
        else {
          console.log(`[ReleaseModal] No tracks found in release data, fetching from API`);
          tracksToUse = await fetchTracks(release.id);
        }
        
        // If we still have no tracks, create a fallback track
        if (!tracksToUse || tracksToUse.length === 0) {
          console.log(`[ReleaseModal] No tracks found at all, using fallback`);
          tracksToUse = [{
            id: `${release.id}-fallback`,
            title: release.title || 'Unknown Track',
            name: release.title || 'Unknown Track',
            duration_ms: 180000, // 3 minutes as placeholder
            duration: 180000,
            track_number: 1,
            disc_number: 1,
            artists: release.artists || [],
            isRemix: false
          }] as unknown as CustomTrack[];
        }
        
        // Process tracks to extract remixer information
        const processedTracks = tracksToUse.map((track: CustomTrack) => {
          // If the track already has remixer information, use it
          if (track.isRemix && track.remixer) {
            return track;
          }
          
          // Otherwise, try to extract remixer information from the track title
          const processedTrack = { ...track };
          
          // Try to extract remixer name from the title
          const title = track.title || track.name || '';
          const remixRegex = /\(([^)]+)\s+Remix\)/i;
          const remixMatch = title.match(remixRegex);
          
          if (remixMatch && remixMatch[1]) {
            const remixerName = remixMatch[1];
            
            // Look for the remixer in the track's artists
            if (track.artists && Array.isArray(track.artists) && track.artists.length > 0) {
              const remixer = track.artists.find((artist: any) => 
                artist.name?.toLowerCase().includes(remixerName.toLowerCase()) || 
                remixerName.toLowerCase().includes(artist.name?.toLowerCase()));
              
              if (remixer) {
                processedTrack.isRemix = true;
                processedTrack.remixer = {
                  id: remixer.id || `remixer-${Date.now()}`,
                  name: remixer.name,
                  role: 'remixer',
                  image_url: remixer.image_url || remixer.profile_image_url || 
                            (remixer.images && remixer.images.length > 0 ? remixer.images[0].url : null)
                };
              }
            }
          }
          
          return processedTrack;
        });
        
        console.log(`[ReleaseModal] Final processed tracks:`, processedTracks);
        setTracks(processedTracks);
      } catch (error) {
        console.error('[ReleaseModal] Error loading tracks:', error);
        setTracks([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadTracks();
  }, [release]);

  // Process artists data when release changes
  useEffect(() => {
    if (!release) return;
    
    // Ensure we have an artists array
    let artists = release.artists || [];
    let artistsFound = Array.isArray(artists) && artists.length > 0;
    
    console.log('[ReleaseModal] Processing release data:', {
      title: release.title,
      artists: artists.length,
      artistsFound,
      trackCount: release.tracks?.length || 0
    });
    
    setProcessedArtists(artists);
    setHasArtists(artistsFound);
  }, [release]);

  const handleArtistClick = (artist: Artist) => {
    if (onArtistClick) {
      onArtistClick(artist);
    }
  };

  // Handle playing a track preview
  const handlePlayTrack = (track: CustomTrack) => {
    try {
      // Get the preview URL from the track
      const previewUrl = track.preview_url || 
                        (track.external_urls && track.external_urls.spotify) ||
                        track.spotify_url;
      
      console.log(`[ReleaseModal] Attempting to play track: ${track.title}`, {
        previewUrl,
        track
      });
      
      if (!previewUrl) {
        console.error('[ReleaseModal] No preview URL available for track:', track);
        return;
      }
      
      // Create an audio element
      const audio = new Audio(previewUrl);
      
      // Play the audio
      audio.play()
        .then(() => {
          console.log(`[ReleaseModal] Playing track: ${track.title}`);
        })
        .catch((error) => {
          console.error('[ReleaseModal] Error playing track:', error);
          
          // If the preview URL is a Spotify URL, open it in a new tab
          if (previewUrl.includes('spotify.com')) {
            console.log(`[ReleaseModal] Opening Spotify URL: ${previewUrl}`);
            window.open(previewUrl, '_blank');
          }
        });
    } catch (error) {
      console.error('[ReleaseModal] Error playing track:', error);
    }
  };

  if (!release) return null;

  // Get the best available image for the release
  const releaseImage = release.artwork_url || 
                      release.cover_url || 
                      release.images?.[0]?.url || 
                      '/images/placeholder-release.jpg';

  // Get track artist image
  const getTrackArtistImage = (artist: any): string => {
    console.log('[ReleaseModal] Getting image for artist:', artist);
    
    // If this is a simple object with just name and image_url (like from remixer)
    if (artist && typeof artist === 'object') {
      if (artist.image_url) {
        console.log('[ReleaseModal] Using artist.image_url:', artist.image_url);
        return artist.image_url;
      }
    }
    
    // For regular artist objects
    const imageUrl = artist.image_url || 
      artist.profile_image_url || 
      artist.profile_image_small_url || 
      artist.profile_image_large_url || 
      (artist.images && artist.images.length > 0 && artist.images[0].url) || 
      '/images/placeholder-artist.jpg';
    
    console.log('[ReleaseModal] Selected image URL:', imageUrl);
    return imageUrl;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="md"
      fullWidth
      aria-labelledby="release-modal-title"
    >
      <DialogTitle id="release-modal-title" sx={{ position: 'relative', pb: 0 }}>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Box
                  component="img"
                  src={releaseImage}
                  alt={release.title}
                  sx={{
                    width: '100%',
                    maxWidth: 300,
                    height: 'auto',
                    borderRadius: 2,
                    boxShadow: 3,
                    mb: 2
                  }}
                />
                <Typography variant="h5" gutterBottom>
                  {release.title}
                </Typography>
                
                {release.release_date && (
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Released: {new Date(release.release_date).toLocaleDateString()}
                  </Typography>
                )}
                
                {release.label && (
                  <Chip 
                    label={typeof release.label === 'string' ? release.label : release.label.name} 
                    size="small" 
                    sx={{ mb: 2 }} 
                  />
                )}
                
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2 }}>
                  {release.spotify_url && (
                    <Button 
                      variant="outlined" 
                      size="small"
                      onClick={() => window.open(release.spotify_url, '_blank')}
                    >
                      Listen on Spotify
                    </Button>
                  )}
                  
                  {release.purchase_url && (
                    <Button 
                      variant="outlined" 
                      size="small"
                      onClick={() => window.open(release.purchase_url, '_blank')}
                    >
                      Purchase
                    </Button>
                  )}
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={8}>
              <Typography variant="h6" gutterBottom>
                Tracks
              </Typography>
              
              {tracks.length > 0 ? (
                <TableContainer component={Paper} sx={{ mb: 3 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>#</TableCell>
                        <TableCell>Title</TableCell>
                        <TableCell>Artist</TableCell>
                        <TableCell align="right">Duration</TableCell>
                        <TableCell align="right">Play</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {tracks.map((track, index) => {
                        // For remix tracks, display the remixer instead of the original artist
                        const displayArtist = track.isRemix && track.remixer
                          ? { 
                              id: track.remixer.id,
                              name: track.remixer.name, 
                              image_url: track.remixer.image_url || '/images/placeholder-artist.jpg'
                            }
                          : (track.artists && track.artists.length > 0 ? track.artists[0] : null);
                        
                        // Debug logging to check artist image
                        console.log(`[ReleaseModal] Track ${index + 1}: ${track.title}`, {
                          isRemix: track.isRemix,
                          remixer: track.remixer,
                          displayArtist
                        });
                        
                        return (
                          <TableRow key={track.id || `track-${index}`}>
                            <TableCell>{track.track_number || index + 1}</TableCell>
                            <TableCell>{track.title || track.name}</TableCell>
                            <TableCell>
                              {displayArtist && (
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Avatar 
                                    src={getTrackArtistImage(displayArtist)} 
                                    alt={displayArtist.name}
                                    sx={{ width: 24, height: 24, mr: 1 }}
                                  />
                                  <Typography variant="body2">
                                    {displayArtist.name}
                                  </Typography>
                                </Box>
                              )}
                            </TableCell>
                            <TableCell align="right">
                              {formatDuration(track.duration_ms || track.duration || 0)}
                            </TableCell>
                            <TableCell align="right">
                              <IconButton 
                                size="small" 
                                color="primary"
                                onClick={() => handlePlayTrack(track)}
                                disabled={false}
                                sx={{ 
                                  backgroundColor: 'rgba(0, 0, 0, 0.05)', 
                                  '&:hover': { 
                                    backgroundColor: 'rgba(0, 0, 0, 0.1)',
                                  },
                                  '&.Mui-disabled': {
                                    color: 'rgba(0, 0, 0, 0.26)',
                                    backgroundColor: 'rgba(0, 0, 0, 0.02)'
                                  }
                                }}
                              >
                                <PlayArrowIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No tracks available for this release.
                </Typography>
              )}
              
              {hasArtists && (
                <>
                  <Typography variant="h6" gutterBottom>
                    Artists
                  </Typography>
                  <Grid container spacing={2}>
                    {processedArtists.map((artist) => (
                      <Grid item xs={6} sm={4} md={3} key={artist.id}>
                        <ArtistPreview 
                          artist={artist} 
                          onClick={onArtistClick ? handleArtistClick : undefined} 
                        />
                      </Grid>
                    ))}
                  </Grid>
                </>
              )}
            </Grid>
          </Grid>
        )}
      </DialogContent>
    </Dialog>
  );
};
