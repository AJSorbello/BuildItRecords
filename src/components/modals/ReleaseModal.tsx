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
  AvatarGroup,
  Link,
  Divider,
  CircularProgress,
  Button,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { Close as CloseIcon, PlayArrow as PlayArrowIcon, Login as LoginIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Release } from '../../types/release';
import { Artist } from '../../types/artist';
import { Track } from '../../types/track';
import { databaseService } from '../../services/DatabaseService';
import { useSpotifyAuth } from '../../services/SpotifyAuthService';
import SpotifyPlayer from '../../components/SpotifyPlayer';

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

// Define a custom track interface to handle remixer information
interface CustomTrack extends Omit<Track, 'remixer'> {
  isRemix?: boolean;
  remixer?: Partial<Artist> & {
    role?: string;
  };
  isRemixProcessed?: boolean;
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
           artist.profile_image_large_url || 
           artist.profile_image_small_url || 
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
        variant="square"
        sx={{
          width: 80,
          height: 80,
          marginBottom: 1,
          boxShadow: 1,
          borderRadius: '4px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
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
  const [allArtistsCache, setAllArtistsCache] = useState<Artist[]>([]);
  const [currentTrack, setCurrentTrack] = useState<CustomTrack | null>(null);
  const [playerError, setPlayerError] = useState<string | null>(null);
  
  // Spotify authentication
  const { token, isPremium, login, logout } = useSpotifyAuth();

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
                remixerName.toLowerCase().includes(artist.name.toLowerCase()));
              
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
    
    // Also build a cache of all artists from tracks for remixer lookup
    const allArtistsMap = new Map<string, Artist>();
    
    // First add the main release artists
    artists.forEach(artist => {
      if (artist && artist.id) {
        allArtistsMap.set(artist.id, artist);
        // Also map by name for fuzzy matching
        if (artist.name) {
          allArtistsMap.set(artist.name.toLowerCase(), artist);
        }
      }
    });
    
    // Then add all track artists and remixers
    if (release.tracks && Array.isArray(release.tracks)) {
      release.tracks.forEach((track: any) => {
        // Add track artists
        if (track.artists && Array.isArray(track.artists)) {
          track.artists.forEach((artist: any) => {
            if (artist && artist.id) {
              allArtistsMap.set(artist.id, artist);
              if (artist.name) {
                allArtistsMap.set(artist.name.toLowerCase(), artist);
              }
            }
          });
        }
        
        // Add remixer if present
        if (track.remixer && track.remixer.id) {
          allArtistsMap.set(track.remixer.id, track.remixer);
          if (track.remixer.name) {
            allArtistsMap.set(track.remixer.name.toLowerCase(), track.remixer);
          }
        }
      });
    }
    
    // Store all artists in state for future lookups
    setAllArtistsCache(Array.from(allArtistsMap.values()));
  }, [release]);

  // Function to find an artist by name in our cache
  const findArtistByName = (name: string): Artist | null => {
    if (!name) return null;
    const normalizedName = name.toLowerCase();
    
    // First try exact match
    const exactMatch = allArtistsCache.find(artist => 
      artist.name?.toLowerCase() === normalizedName);
    if (exactMatch) return exactMatch;
    
    // Then try partial matches
    const partialMatch = allArtistsCache.find(artist => 
      artist.name?.toLowerCase().includes(normalizedName) || 
      normalizedName.includes(artist.name?.toLowerCase() || ''));
    if (partialMatch) return partialMatch;
    
    return null;
  };

  // Improved function to extract remixer from track title
  const extractRemixerFromTitle = (title: string): string | null => {
    if (!title) return null;
    
    // Handle various remix patterns
    const remixPatterns = [
      /\(([^)]+)\s+remix\)/i,     // (Artist Remix)
      /\[([^\]]+)\s+remix\]/i,    // [Artist Remix]
      /\(([^)]+)\s+rmx\)/i,       // (Artist Rmx)
      /\-\s*([^-]+)\s+remix/i,    // - Artist Remix
      /\"([^"]+)\s+remix\"/i      // "Artist Remix"
    ];
    
    for (const pattern of remixPatterns) {
      const match = title.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return null;
  };

  // Get the appropriate artist to display for a track
  const getTrackDisplayArtist = (track: CustomTrack) => {
    // For remix tracks, prioritize the remixer
    if (track.isRemix || track.title?.toLowerCase().includes('remix')) {
      // If track has a remixer property with name and image
      if (track.remixer?.name && track.remixer?.image_url) {
        return track.remixer;
      }
      
      // If track has remixer but no image, try to find it
      if (track.remixer?.name && !track.remixer?.image_url) {
        const fullRemixerData = findArtistByName(track.remixer.name);
        if (fullRemixerData?.image_url) {
          return {
            ...track.remixer,
            image_url: fullRemixerData.image_url
          };
        }
      }
      
      // Try to extract remixer name from title
      if (track.title) {
        const remixerName = extractRemixerFromTitle(track.title);
        if (remixerName) {
          // Try to find this remixer in our artist cache
          const remixerFromCache = findArtistByName(remixerName);
          if (remixerFromCache) {
            return remixerFromCache;
          }
          
          // If remixer is in track's artists but not identified as remixer yet
          if (track.artists && Array.isArray(track.artists)) {
            const matchingArtist = track.artists.find(a => 
              a.name?.toLowerCase() === remixerName.toLowerCase() ||
              a.name?.toLowerCase().includes(remixerName.toLowerCase()) ||
              remixerName.toLowerCase().includes(a.name?.toLowerCase() || '')
            );
            
            if (matchingArtist) {
              return {
                ...matchingArtist,
                role: 'remixer'
              };
            }
          }
        }
      }
    }
    
    // Default to the first artist for non-remix tracks
    return track.artists && track.artists.length > 0 ? track.artists[0] : null;
  };

  // Handle artist click
  const handleArtistClick = async (artist: Artist) => {
    console.log(`[ReleaseModal] Artist clicked: ${artist.name}`, artist);
    
    if (!artist.id) {
      console.error('[ReleaseModal] Cannot open artist modal: no artist ID', artist);
      return;
    }
    
    try {
      // For remixers, we might need to fetch their full artist data first
      if (artist.role === 'remixer' || artist.isRemixer || 
          (artist.name && (tracks || []).some(t => 
            t.title?.toLowerCase().includes('remix') && 
            t.title.toLowerCase().includes(artist.name.toLowerCase())
          ))) {
        console.log(`[ReleaseModal] Attempting to fetch full artist data for remixer: ${artist.name}`);
        
        // Try to find this artist in all available labels
        const labels = ['buildit-records', 'buildit-tech', 'buildit-deep']; 
        let fullArtistData: Artist | null = null;
        
        // Try each label - note: we don't use getArtistsForLabel here as it's not needed
        // Instead, if we need to access artist data, we can directly use the current artists list
        if (processedArtists && processedArtists.length > 0) {
          // First try to find by exact ID
          fullArtistData = processedArtists.find(a => a.id === artist.id) || null;
          
          // Then try by name if ID match fails
          if (!fullArtistData) {
            fullArtistData = processedArtists.find(a => 
              a.name?.toLowerCase() === artist.name.toLowerCase() ||
              artist.name.toLowerCase().includes(a.name.toLowerCase()) ||
              a.name?.toLowerCase().includes(artist.name.toLowerCase())
            ) || null;
          }
          
          if (fullArtistData) {
            console.log(`[ReleaseModal] Found full artist data in processedArtists:`, fullArtistData);
          }
        }
        
        // If we still don't have the data and onArtistClick exists
        if (!fullArtistData && onArtistClick) {
          // We'll pass what we have and let the parent component handle the additional lookup
          console.log(`[ReleaseModal] Passing remixer data to parent for further processing:`, artist);
          onArtistClick(artist);
          return;
        }
        
        if (fullArtistData && onArtistClick) {
          console.log(`[ReleaseModal] Opening artist modal with enhanced remixer data:`, fullArtistData);
          onArtistClick(fullArtistData);
          return;
        }
      }
      
      // Default behavior - just pass the artist data we have
      if (onArtistClick) onArtistClick(artist);
    } catch (error) {
      console.error('[ReleaseModal] Error handling artist click:', error);
      
      // Fallback - try to open with what we have
      if (onArtistClick) onArtistClick(artist);
    }
  };

  // Handle playing a track preview
  const handlePlayTrack = (track: CustomTrack) => {
    try {
      // Set the current track for the player
      setCurrentTrack(track);
      
      // Get the preview URL from the track
      const previewUrl = track.preview_url || 
                      (track.external_urls && track.external_urls.spotify) ||
                      track.spotify_url;
      
      console.log(`[ReleaseModal] Attempting to play track: ${track.title}`, {
        previewUrl,
        track,
        hasSpotifyAuth: !!token
      });
      
      if (!previewUrl) {
        console.error('[ReleaseModal] No preview URL available for track:', track);
        setPlayerError('No preview available for this track');
        return;
      }
      
      // If we don't have Spotify authentication, use the old method
      if (!token) {
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
      }
      // If we have Spotify auth, the SpotifyPlayer component will handle playback
    } catch (error) {
      console.error('[ReleaseModal] Error playing track:', error);
      setPlayerError('Error playing track. Please try again.');
    }
  };

  // Get artist image with robust fallbacks
  const getArtistImageWithFallbacks = (artist: any): string => {
    if (!artist) return '/images/placeholder-artist.jpg';
    
    // Try all possible image properties in order of preference
    return artist.image_url || 
      artist.profile_image_url || 
      artist.profile_image_large_url || 
      artist.profile_image_small_url || 
      (artist.images && Array.isArray(artist.images) && artist.images.length > 0 ? artist.images[0].url : null) ||
      '/images/placeholder-artist.jpg';
  };

  if (!release) return null;

  // Get the best available image for the release
  const releaseImage = release.artwork_url || 
                      release.cover_url || 
                      release.images?.[0]?.url || 
                      '/images/placeholder-release.jpg';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      fullScreen={fullScreen}
      PaperProps={{
        sx: {
          bgcolor: 'background.paper',
          borderRadius: { xs: 0, sm: 1 },
          backgroundImage: 'none'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Typography variant="h6">{release?.title}</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {/* Spotify Login/Logout Button */}
          {token ? (
            <Button 
              variant="outlined" 
              size="small" 
              onClick={logout} 
              startIcon={<LoginIcon />}
              sx={{ mr: 1, height: 36 }}
            >
              Logout
            </Button>
          ) : (
            <Button 
              variant="outlined" 
              color="primary" 
              size="small" 
              onClick={login} 
              startIcon={<LoginIcon />}
              sx={{ mr: 1, height: 36 }}
            >
              Connect Spotify
            </Button>
          )}
          <IconButton aria-label="close" onClick={onClose} size="large">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Box
                component="img"
                src={release?.image_url || '/images/placeholder-release.jpg'}
                alt={release?.title}
                sx={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: 1,
                  boxShadow: 3,
                  mb: 2
                }}
              />
              <Typography variant="h6" gutterBottom>
                {release?.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {release?.release_date && new Date(release.release_date).getFullYear()}
              </Typography>
              {release?.label && (
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {release.label}
                </Typography>
              )}
              {release?.genres && release.genres.length > 0 && (
                <Box sx={{ mt: 2, mb: 2 }}>
                  {release.genres.map((genre) => (
                    <Chip
                      key={genre}
                      label={genre}
                      size="small"
                      sx={{ mr: 0.5, mb: 0.5 }}
                    />
                  ))}
                </Box>
              )}
              
              {/* Spotify Player */}
              {currentTrack && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Now Playing
                  </Typography>
                  {playerError && (
                    <Typography variant="body2" color="error" sx={{ mb: 1 }}>
                      {playerError}
                    </Typography>
                  )}
                  
                  {token ? (
                    <SpotifyPlayer 
                      token={token}
                      trackUrl={currentTrack.external_urls?.spotify || currentTrack.spotify_url}
                      isPremium={isPremium || false}
                      onError={(msg) => setPlayerError(msg)}
                    />
                  ) : (
                    <Paper sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                      <Typography variant="body2" align="center" gutterBottom>
                        {currentTrack.title}
                      </Typography>
                      <Button 
                        variant="contained" 
                        color="primary" 
                        fullWidth 
                        startIcon={<LoginIcon />}
                        onClick={login}
                        sx={{ mt: 1 }}
                      >
                        Connect to Spotify
                      </Button>
                    </Paper>
                  )}
                </Box>
              )}
            </Grid>
            <Grid item xs={12} md={8}>
              {tracks && tracks.length > 0 ? (
                <TableContainer component={Paper} sx={{ boxShadow: 0, bgcolor: 'transparent' }}>
                  <Table sx={{ minWidth: 650 }} aria-label="track listing">
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
                        let displayArtist;
                        let combinedArtistName = '';
                        
                        if (track.isRemix && track.remixer) {
                          // For remixes, show the remixer
                          displayArtist = { 
                            id: track.remixer.id,
                            name: track.remixer.name, 
                            image_url: track.remixer.image_url || '/images/placeholder-artist.jpg'
                          };
                        } else if (track.artists && track.artists.length > 0) {
                          // For regular tracks with collaborating artists
                          // Use the first artist for the avatar image
                          displayArtist = track.artists[0];
                          
                          // Create a combined name for all artists (e.g. "Anmol Jhanb & Bob Bentley")
                          combinedArtistName = track.artists.map(a => a.name).join(' & ');
                          
                          console.log(`[ReleaseModal] Combined artist name: ${combinedArtistName}`);
                        } else {
                          displayArtist = null;
                        }
                        
                        // Debug logging to check artist image
                        console.log(`[ReleaseModal] Track ${index + 1}: ${track.title}`, {
                          isRemix: track.isRemix,
                          remixer: track.remixer,
                          displayArtist,
                          artistCount: track.artists?.length || 0
                        });
                        
                        return (
                          <TableRow key={track.id || `track-${index}`}>
                            <TableCell>{track.track_number || index + 1}</TableCell>
                            <TableCell>{track.title || track.name}</TableCell>
                            <TableCell>
                              {track.isRemix || track.title?.toLowerCase().includes('remix') ? (
                                // For remix tracks, show the remixer avatar and info
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  {(() => {
                                    // Find remixer information
                                    const remixerArtist = getTrackDisplayArtist(track);
                                    if (!remixerArtist) return null;
                                    
                                    let remixerName = remixerArtist.name;
                                    // Extract from title if needed
                                    if (!remixerName && track.title) {
                                      const remixName = extractRemixerFromTitle(track.title);
                                      if (remixName) remixerName = remixName;
                                    }
                                    
                                    // Get the best image URL available
                                    const imageUrl = getArtistImageWithFallbacks(remixerArtist);
                                    
                                    return (
                                      <>
                                        <Avatar 
                                          src={imageUrl}
                                          alt={remixerName || 'Remixer'}
                                          variant="square"
                                          sx={{
                                            width: 22,
                                            height: 22,
                                            fontSize: '0.8rem',
                                            borderRadius: '2px',
                                            marginRight: 1,
                                            border: '1px solid rgba(255, 255, 255, 0.1)'
                                          }}
                                        />
                                        <Typography
                                          variant="body2"
                                          sx={{
                                            cursor: 'pointer',
                                            '&:hover': {
                                              textDecoration: 'underline',
                                              color: 'primary.main',
                                            },
                                          }}
                                          onClick={() => {
                                            if (remixerArtist && onArtistClick) {
                                              console.log(`[ReleaseModal] Remixer clicked: ${remixerArtist.name}`);
                                              handleArtistClick(remixerArtist as Artist);
                                            }
                                          }}
                                        >
                                          {remixerName || 'Remixer'}
                                        </Typography>
                                      </>
                                    );
                                  })()}
                                </Box>
                              ) : (
                                // For regular tracks, show the artist(s)
                                track.artists && track.artists.length > 1 ? (
                                  <AvatarGroup 
                                    max={3} 
                                    sx={{ 
                                      display: 'inline-flex', 
                                      mr: 1,
                                      '& .MuiAvatar-root': { 
                                        width: 22, 
                                        height: 22,
                                        fontSize: '0.8rem',
                                        borderRadius: '2px'
                                      }
                                    }}
                                  >
                                    {track.artists.map(artist => (
                                      <Avatar 
                                        key={artist.id} 
                                        alt={artist.name} 
                                        src={getArtistImageWithFallbacks(artist)}
                                        variant="square"
                                        sx={{
                                          border: '1px solid rgba(255, 255, 255, 0.1)'
                                        }}
                                      />
                                    ))}
                                  </AvatarGroup>
                                ) : displayArtist ? (
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Avatar 
                                      src={getArtistImageWithFallbacks(displayArtist)} 
                                      alt={displayArtist.name}
                                      variant="square"
                                      sx={{
                                        width: 22,
                                        height: 22,
                                        fontSize: '0.8rem',
                                        borderRadius: '2px',
                                        border: '1px solid rgba(255, 255, 255, 0.1)'
                                      }}
                                    />
                                    <Box>
                                      {combinedArtistName ? (
                                        // If there are multiple artists, split and make each one clickable
                                        track.artists.map((artist, artistIndex) => (
                                          <Box component="span" key={artist.id || `artist-${artistIndex}`}>
                                            <Typography
                                              component="span"
                                              variant="body2"
                                              sx={{
                                                cursor: 'pointer',
                                                '&:hover': {
                                                  textDecoration: 'underline',
                                                  color: 'primary.main',
                                                },
                                              }}
                                              onClick={() => {
                                                console.log(`[ReleaseModal] Artist clicked from multi-artist track: ${artist.name}`);
                                                handleArtistClick(artist);
                                              }}
                                            >
                                              {artist.name}
                                            </Typography>
                                            {artistIndex < track.artists.length - 1 && (
                                              <Typography component="span" variant="body2"> & </Typography>
                                            )}
                                          </Box>
                                        ))
                                      ) : (
                                        // If there's a single artist, make it clickable
                                        <Typography
                                          variant="body2"
                                          sx={{
                                            cursor: 'pointer',
                                            '&:hover': {
                                              textDecoration: 'underline',
                                              color: 'primary.main',
                                            },
                                          }}
                                          onClick={() => {
                                            console.log(`[ReleaseModal] Artist clicked from single-artist track: ${displayArtist.name}`);
                                            handleArtistClick(displayArtist);
                                          }}
                                        >
                                          {displayArtist.name}
                                        </Typography>
                                      )}
                                    </Box>
                                  </Box>
                                ) : null
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
                                disabled={!track.preview_url && !track.external_urls?.spotify && !track.spotify_url}
                                sx={{ 
                                  backgroundColor: currentTrack?.id === track.id ? 'rgba(29, 185, 84, 0.1)' : 'rgba(0, 0, 0, 0.05)', 
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
