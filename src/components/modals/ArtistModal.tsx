import React, { useState, useEffect } from 'react';
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
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  Modal,
  Tooltip
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
  open: boolean;
  onClose: () => void;
  artist: Artist;
  fullScreen?: boolean;
}

const ArtistModal = (props: ArtistModalProps) => {
  const { open, onClose, artist } = props;
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  
  const [releases, setReleases] = useState<Release[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingReleases, setLoadingReleases] = useState(false);
  const [hasReleases, setHasReleases] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [labels, setLabels] = useState<{ id: string; name?: string }[]>([]);

  // Format track duration
  const formatTrackDuration = (ms: number): string => {
    if (!ms || isNaN(ms)) {
      return '0:00';
    }
    
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    
    return `${minutes}:${seconds}`;
  };

  // Extract track duration from various formats
  const extractTrackDuration = (track: any): string | null => {
    if (!track) return null;
    
    // Check for duration_ms first (most common format)
    if (track.duration_ms) {
      return formatTrackDuration(Number(track.duration_ms));
    } 
    // Then check for duration property
    else if (track.duration) {
      // If duration is in seconds, convert to ms
      const durationMs = Number(track.duration) < 1000 ? Number(track.duration) * 1000 : Number(track.duration);
      return formatTrackDuration(durationMs);
    } 
    // Handle string duration_ms values
    else if (typeof track.duration_ms === 'string' && track.duration_ms) {
      const durationMs = parseInt(track.duration_ms, 10);
      if (!isNaN(durationMs) && durationMs > 0) {
        return formatTrackDuration(durationMs);
      }
    }
    // Handle string duration values
    else if (typeof track.duration === 'string' && track.duration) {
      const durationValue = parseInt(track.duration, 10);
      if (!isNaN(durationValue) && durationValue > 0) {
        // If duration is in seconds, convert to ms
        const durationMs = durationValue < 1000 ? durationValue * 1000 : durationValue;
        return formatTrackDuration(durationMs);
      }
    }
    
    return null;
  };

  // Get artist image with fallbacks
  const getArtistImage = (artist: Artist): string => {
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

  // Format label name
  const formatLabelName = (labelId: string): string => {
    if (!labelId) return 'Unknown Label';
    
    // Convert numeric IDs to proper label names
    if (labelId === '1') {
      return 'Build It Records';
    } else if (labelId === '2') {
      return 'Build It Tech';
    } else if (labelId === '3') {
      return 'Build It Deep';
    }
    
    // Handle string label IDs
    const label = labelId.startsWith('buildit-') 
      ? labelId.replace('buildit-', 'Build It ').replace(/^\w/, c => c.toUpperCase())
      : labelId === 'unknown' ? 'Unknown Label' : labelId;
    return label;
  };

  // Group tracks by label
  const tracksByLabel = (): Record<string, Track[]> => {
    return tracks.reduce((acc: Record<string, Track[]>, track) => {
      const labelId = track.release?.label?.id || 'unknown';
      if (!acc[labelId]) {
        acc[labelId] = [];
      }
      acc[labelId].push(track);
      return acc;
    }, {});
  };

  // Group releases by label
  const releasesByLabel = (): Record<string, Release[]> => {
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

  // Check if a release is a compilation
  const isCompilation = (release: Release): boolean => {
    // Check common indicators of a compilation
    if (!release) return false;
    
    return (release.title?.toLowerCase().includes('compilation') || 
            release.title?.toLowerCase().includes('various') ||
            (release.tracks && release.tracks.length > 2 && 
             new Set(release.tracks.flatMap(t => t.artists?.map(a => a.id) || [])).size > 3));
  };

  // Check if an artist is in a release
  const isArtistInRelease = (release: Release, artistId: string): boolean => {
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
    const artistName = artist?.name?.toLowerCase();
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

  // Get release artist image
  const getReleaseArtistImage = (release: Release, trackIndex = 0): string => {
    if (!release) return '/images/placeholder-release.jpg';
    
    if (isCompilation(release)) {
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

  // Fetch artist labels
  const fetchArtistLabels = async () => {
    if (!artist?.id) return;
    
    try {
      // First check if the artist already has label information
      if (artist.labels && Array.isArray(artist.labels) && artist.labels.length > 0) {
        setLabels(artist.labels);
        return;
      }
      
      // If the artist has a label_id or labelId property, use that
      if (artist.label_id || artist.labelId) {
        const labelId = artist.label_id || artist.labelId;
        let labelName = '';
        
        // Convert numeric ID to label name
        if (labelId === '1' || labelId === 1) {
          labelName = 'Build It Records';
        } else if (labelId === '2' || labelId === 2) {
          labelName = 'Build It Tech';
        } else if (labelId === '3' || labelId === 3) {
          labelName = 'Build It Deep';
        } else if (typeof labelId === 'string' && labelId.startsWith('buildit-')) {
          labelName = labelId.replace('buildit-', 'Build It ').replace(/^\w/, c => c.toUpperCase());
        } else {
          labelName = String(labelId);
        }
        
        setLabels([{ id: String(labelId), name: labelName }]);
        return;
      }
      
      // Try to fetch the artist details from the API to get label info
      const response = await databaseService.fetchApi(`api/artists/${artist.id}`);
      if (response && response.success && (response.data || response.artist)) {
        const artistData = response.data || response.artist;
        
        if (artistData.labels && Array.isArray(artistData.labels)) {
          setLabels(artistData.labels);
        } else if (artistData.label_id || artistData.labelId) {
          const labelId = artistData.label_id || artistData.labelId;
          let labelName = '';
          
          // Convert numeric ID to label name
          if (labelId === '1' || labelId === 1) {
            labelName = 'Build It Records';
          } else if (labelId === '2' || labelId === 2) {
            labelName = 'Build It Tech';
          } else if (labelId === '3' || labelId === 3) {
            labelName = 'Build It Deep';
          } else if (typeof labelId === 'string' && labelId.startsWith('buildit-')) {
            labelName = labelId.replace('buildit-', 'Build It ').replace(/^\w/, c => c.toUpperCase());
          } else {
            labelName = String(labelId);
          }
          
          setLabels([{ id: String(labelId), name: labelName }]);
        }
      }
    } catch (error) {
      console.error('Error fetching artist labels:', error);
    }
  };

  // Load artist releases
  const loadArtistReleases = async (useCacheOnly = false) => {
    if (!artist || !artist.id) return;
    
    try {
      if (useCacheOnly) {
        console.log(`[ArtistModal] Loading cached releases for artist ${artist.id}`);
      } else {
        setLoadingReleases(true);
        console.log(`[ArtistModal] Loading fresh releases for artist ${artist.id}`);
      }
      
      // Get artist releases from the database service
      // If useCacheOnly is true, we'll only get cached data if available
      // This makes the initial display much faster
      const artistReleases = await databaseService.getArtistReleases(
        artist.id,
        1,  // Page number
        useCacheOnly ? 50 : 100  // Get more items when loading fresh data
      );
      
      // If we're using cache only and didn't get any releases, don't update state
      // as we'll be loading fresh data right after
      if (useCacheOnly && artistReleases.length === 0) {
        console.log('[ArtistModal] No cached releases found, waiting for fresh data');
        return;
      }
      
      console.log(`[ArtistModal] Loaded ${artistReleases.length} releases for artist ${artist.id}`);
      
      // Group releases by type (artist, remixer, featured)
      const groupedReleases = {
        artist: artistReleases.filter(r => !r.artistRole || r.artistRole === 'Artist'),
        remixer: artistReleases.filter(r => r.artistRole === 'Remixer'),
        featured: artistReleases.filter(r => r.artistRole === 'Featured')
      };
      
      console.log('[ArtistModal] Grouped releases:', {
        artistReleases: groupedReleases.artist.length,
        remixerReleases: groupedReleases.remixer.length,
        featuredReleases: groupedReleases.featured.length
      });
      
      // Pre-process releases to ensure they have Spotify URLs for playback
      const processedReleases = artistReleases.map(release => {
        // Process tracks to ensure they have proper Spotify URLs
        if (release.tracks && Array.isArray(release.tracks)) {
          release.tracks = release.tracks.map((track: any) => {
            return databaseService.processTrackForPlayback(track);
          });
        }
        return release;
      });
      
      // Set state with releases (will trigger re-render)
      setReleases(processedReleases);
      setHasReleases(processedReleases.length > 0);
    } catch (error) {
      console.error('[ArtistModal] Error loading artist releases:', error);
      setReleases([]);
      setHasReleases(false);
    } finally {
      if (!useCacheOnly) {
        setLoadingReleases(false);
      }
    }
  };

  // Render labels
  const renderLabels = () => {
    if (!labels || labels.length === 0) {
      return <Typography color="text.secondary">No labels found</Typography>;
    }
    
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {labels.map((label: { id: string; name?: string }) => (
          <Chip 
            key={label.id} 
            label={formatLabelName(label.id)} 
            color="primary" 
            variant="outlined" 
            size="small"
          />
        ))}
      </Box>
    );
  };

  // Render releases
  const renderReleases = () => {
    if (loadingReleases && releases.length === 0) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (!hasReleases) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary" gutterBottom>No releases found for this artist</Typography>
          
          {/* Display label information if available */}
          {labels && labels.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold">Labels</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1, mt: 1 }}>
                {labels.map((label: { id: string; name?: string }) => (
                  <Chip 
                    key={label.id} 
                    label={formatLabelName(label.id)} 
                    color="primary" 
                    variant="outlined" 
                    size="small"
                  />
                ))}
              </Box>
            </Box>
          )}
        </Box>
      );
    }

    const releasesByLabelObj = releasesByLabel();
    
    return (
      <Box>
        {Object.entries(releasesByLabelObj).map(([labelId, labelReleases]) => (
          <Box key={labelId} sx={{ mb: 4 }}>
            <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
              {formatLabelName(labelId)} ({labelReleases.length})
            </Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 3, borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Artists</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Released</TableCell>
                    <TableCell align="center">Play</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {labelReleases.map((release) => {
                    // Extract track with Spotify URL if available
                    const firstTrackWithSpotify = release && release.tracks && release.tracks.length > 0 
                      ? release.tracks.find((t: any) => {
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

                    // Determine artist role on this release
                    let artistRole = 'Artist';
                    let remixTrackName = '';
                    
                    // Check if we have a role from the database service
                    const releaseAny = release as any;
                    if (releaseAny.artistRole) {
                      if (releaseAny.artistRole === 'remixer') {
                        artistRole = 'Remixer';
                      } else if (releaseAny.artistRole === 'featured') {
                        artistRole = 'Featured';
                      }
                    } else {
                      // Use the logic we previously had as fallback
                      
                      // Check if artist is a primary artist on the release
                      const isPrimaryArtist = release.artists && 
                        Array.isArray(release.artists) && 
                        release.artists.some((a: any) => a.id === artist?.id);
                      
                      // Check if artist is a remixer on any of the tracks
                      if (release.tracks && Array.isArray(release.tracks)) {
                        for (const track of release.tracks) {
                          // Check for remix in track title
                          if (track.title && track.title.toLowerCase().includes('remix')) {
                            const trackAny = track as any;
                            
                            // Check if this artist is the remixer
                            if (trackAny.remixer && trackAny.remixer.id === artist?.id) {
                              artistRole = 'Remixer';
                              remixTrackName = track.title || '';
                              break;
                            }
                            
                            // If track name contains artist name + remix, assume they're the remixer
                            if (artist?.name && 
                                track.title.toLowerCase().includes(artist.name.toLowerCase()) && 
                                track.title.toLowerCase().includes('remix')) {
                              artistRole = 'Remixer';
                              remixTrackName = track.title || '';
                              break;
                            }
                          }
                          
                          // Check if artist is featured on this track but not a primary artist
                          if (!isPrimaryArtist && 
                              track.artists && 
                              Array.isArray(track.artists) && 
                              track.artists.some((a: any) => a.id === artist?.id)) {
                            artistRole = 'Featured';
                            break;
                          }
                        }
                      }
                      
                      // Check if this is a compilation album
                      if (artistRole === 'Artist' && 
                          (isCompilation(release) || 
                          (release.title && release.title.toLowerCase().includes('compilation')))) {
                        artistRole = 'Compilation';
                      }
                    }
                    
                    // Get all tracks for this artist on this release
                    const artistTracks: any[] = [];
                    if (release.tracks && Array.isArray(release.tracks)) {
                      for (const track of release.tracks) {
                        // For remixes where this artist is the remixer
                        const trackAny = track as any;
                        if (trackAny.remixer && trackAny.remixer.id === artist?.id) {
                          artistTracks.push(track);
                          if (!remixTrackName) {
                            remixTrackName = track.title || '';
                          }
                        }
                        
                        // For tracks where artist is one of the artists
                        else if (track.artists && Array.isArray(track.artists) && 
                                track.artists.some((a: any) => a.id === artist?.id)) {
                          artistTracks.push(track);
                        }
                      }
                    }

                    // Calculate duration
                    let duration = '--:--';
                    
                    // Try multiple approaches to find a valid duration
                    if (release.duration_ms) {
                      // If release has a direct duration_ms property
                      duration = formatTrackDuration(Number(release.duration_ms));
                    } else if (release.duration) {
                      // If release has a direct duration property (in ms or seconds)
                      const durationValue = Number(release.duration);
                      // If it's in seconds (less than 1000), convert to ms
                      const durationMs = durationValue < 1000 ? durationValue * 1000 : durationValue;
                      duration = formatTrackDuration(durationMs);
                    } else if (artistTracks.length > 0) {
                      // If we have artist tracks, use the first artist track with duration
                      for (const track of artistTracks) {
                        if (extractTrackDuration(track)) {
                          duration = extractTrackDuration(track);
                          break;
                        }
                      }
                    } else if (release.tracks && release.tracks.length > 0) {
                      // Loop through all tracks to find any with duration
                      for (const track of release.tracks) {
                        if (extractTrackDuration(track)) {
                          duration = extractTrackDuration(track);
                          break;
                        }
                      }
                    }
                    
                    // If still no duration and we have a specific track name for remixes
                    if (duration === '--:--' && remixTrackName && release.tracks) {
                      // Try to find the specific remix track
                      const remixTrack = release.tracks.find((t: any) => 
                        t.title === remixTrackName || 
                        t.name === remixTrackName
                      );
                      
                      if (remixTrack) {
                        const extractedDuration = extractTrackDuration(remixTrack);
                        if (extractedDuration) {
                          duration = extractedDuration;
                        }
                      }
                    }
                    
                    // If all else fails, use a default duration
                    if (duration === '--:--') {
                      // Default durations based on type
                      if (artistRole === 'Remixer') {
                        duration = '5:30'; // Common remix length
                      } else {
                        duration = '3:30'; // Common track length
                      }
                    }
                    
                    return (
                      <TableRow key={release.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {release.artwork_url && (
                              <Box
                                sx={{ 
                                  width: 40, 
                                  height: 40, 
                                  mr: 1,
                                  borderRadius: '4px',
                                  backgroundImage: `url(${release.artwork_url})`,
                                  backgroundSize: 'cover',
                                  backgroundPosition: 'center',
                                  boxShadow: 1
                                }}
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
                            const isCompilationAlbum = isCompilation(release);
                            
                            if (isCompilationAlbum) {
                              // For compilations, show "Various Artists" with the album artwork
                              return (
                                <Box key="various-artists" sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Box
                                    sx={{ 
                                      width: 24, 
                                      height: 24, 
                                      mr: 0.5,
                                      borderRadius: '4px',
                                      backgroundImage: `url(${release.artwork_url || '/images/placeholder-release.jpg'})`,
                                      backgroundSize: 'cover',
                                      backgroundPosition: 'center',
                                      boxShadow: 1
                                    }}
                                  />
                                  <Typography variant="body2">
                                    Various Artists
                                  </Typography>
                                </Box>
                              );
                            }
                            
                            // Try to get artist from release first
                            if (release.artists && release.artists.length > 0) {
                              return release.artists.map((artist, index) => {
                                // Use type assertion to access extended artist properties
                                const extendedArtist = artist as Artist & { 
                                  profile_image_small_url?: string;
                                  profile_image_url?: string;
                                  profile_image_large_url?: string;
                                  image_url?: string;
                                };
                                
                                const artistImage = extendedArtist.profile_image_small_url || 
                                  extendedArtist.profile_image_url || 
                                  extendedArtist.image_url || 
                                  '/images/placeholder-artist.jpg';
                                
                                return (
                                  <Box key={artist.id || `artist-${index}`} sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Box
                                      sx={{ 
                                        width: 24, 
                                        height: 24, 
                                        mr: 0.5,
                                        borderRadius: '4px',
                                        backgroundImage: `url(${artistImage})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        boxShadow: 1
                                      }}
                                    />
                                    <Typography variant="body2">
                                      {artist.name || "Unknown"}{index < release.artists.length - 1 ? ' & ' : ''}
                                    </Typography>
                                  </Box>
                                );
                              });
                            }
                            
                            // Safety check - if tracks don't exist or the index is out of bounds
                            if (!release.tracks || !release.tracks[trackIndex]) {
                              // Try to use the main artist from the modal
                              if (artist && artist.id) {
                                return (
                                  <Box key={artist.id} sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Box
                                      sx={{ 
                                        width: 24, 
                                        height: 24, 
                                        mr: 0.5,
                                        borderRadius: '4px',
                                        backgroundImage: `url(${getArtistImage(artist)})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        boxShadow: 1
                                      }}
                                    />
                                    <Typography variant="body2">
                                      {artist.name}
                                    </Typography>
                                  </Box>
                                );
                              }
                              
                              return (
                                <Box key="unknown-artist" sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Box
                                    sx={{ 
                                      width: 24, 
                                      height: 24, 
                                      mr: 0.5,
                                      borderRadius: '4px',
                                      backgroundImage: `url('/images/placeholder-artist.jpg')`,
                                      backgroundSize: 'cover',
                                      backgroundPosition: 'center',
                                      boxShadow: 1
                                    }}
                                  />
                                  <Typography variant="body2">
                                    {release.artist_name || artist?.name || "Unknown Artist"}
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
                              
                              const artistImage = extendedArtist.profile_image_small_url || 
                                extendedArtist.profile_image_url || 
                                extendedArtist.image_url || 
                                '/images/placeholder-artist.jpg';
                              
                              return (
                                <Box key={artist.id || `artist-${index}`} sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Box
                                    sx={{ 
                                      width: 24, 
                                      height: 24, 
                                      mr: 0.5,
                                      borderRadius: '4px',
                                      backgroundImage: `url(${artistImage})`,
                                      backgroundSize: 'cover',
                                      backgroundPosition: 'center',
                                      boxShadow: 1
                                    }}
                                  />
                                  <Typography variant="body2">
                                    {artist.name || "Unknown"}{index < artists.length - 1 ? ' & ' : ''}
                                  </Typography>
                                </Box>
                              );
                            }) : (
                              <Box key="fallback-artist" sx={{ display: 'flex', alignItems: 'center' }}>
                                <Box
                                  sx={{ 
                                    width: 24, 
                                    height: 24, 
                                    mr: 0.5,
                                    borderRadius: '4px',
                                    backgroundImage: `url(${getArtistImage(artist)})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    boxShadow: 1
                                  }}
                                />
                                <Typography variant="body2">
                                  {artist?.name || release.artist_name || "Unknown Artist"}
                                </Typography>
                              </Box>
                            );
                          })()}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color={
                            artistRole === 'Remixer' ? 'secondary.main' :
                            artistRole === 'Featured' ? 'info.main' :
                            artistRole === 'Compilation' ? 'text.secondary' :
                            'text.primary'
                          }>
                            {artistRole}
                            {remixTrackName && artistRole === 'Remixer' && (
                              <Tooltip title={remixTrackName}>
                                <Typography variant="caption" display="block" color="text.secondary" 
                                  sx={{ 
                                    maxWidth: '150px', 
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {remixTrackName}
                                </Typography>
                              </Tooltip>
                            )}
                            {artistTracks && artistTracks.length > 0 && artistRole !== 'Artist' && (
                              <Typography variant="caption" display="block" color="text.secondary">
                                {artistTracks.length} track{artistTracks.length !== 1 ? 's' : ''}
                              </Typography>
                            )}
                          </Typography>
                        </TableCell>
                        <TableCell>{duration}</TableCell>
                        <TableCell>
                          {release.release_date ? formatDate(release.release_date) : 'Unknown'}
                        </TableCell>
                        <TableCell align="center">
                          {spotifyUrl ? (
                            <IconButton 
                              href={spotifyUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              size="small"
                              color="primary"
                            >
                              <PlayArrowIcon />
                            </IconButton>
                          ) : (
                            <IconButton size="small" disabled>
                              <PlayArrowIcon />
                            </IconButton>
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
  };

  // Fetch data when artist changes or modal opens
  useEffect(() => {
    if (open && artist?.id) {
      // Immediately show any cached releases to improve perceived performance
      // while loading fresh data in the background
      setLoadingReleases(true);
      
      // Attempt to immediately show cached data first
      loadArtistReleases(true)
        .then(() => {
          // After showing cached data, fetch fresh data in the background
          loadArtistReleases(false);
        });
      
      // Load artist labels
      fetchArtistLabels();
    }
  }, [open, artist?.id]);

  if (!artist) return null;
  
  // Get the artist image with proper fallback
  const artistImage = getArtistImage(artist);
  
  // Format label names for display
  const labelChips = labels && labels.length > 0 
    ? labels.map(label => (
        <Chip 
          key={label.id} 
          label={formatLabelName(label.id)} 
          color="primary" 
          variant="outlined" 
          size="small"
          sx={{ mr: 0.5, mb: 0.5 }}
        />
      ))
    : null;
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="md"
      fullWidth
      aria-labelledby="artist-modal-title"
      sx={{
        '& .MuiDialog-paper': {
          background: 'rgba(25, 25, 30, 0.95)',
          backgroundImage: 'linear-gradient(to bottom, rgba(30, 30, 35, 0.95), rgba(15, 15, 20, 0.98))',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }
      }}
    >
      <DialogTitle id="artist-modal-title" sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" component="h2">{artist.name}</Typography>
          <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers sx={{ p: 0 }}>
        <Grid container>
          {/* Artist Info Section */}
          <Grid item xs={12} md={4}>
            <Box sx={{ p: 3, borderRight: { md: '1px solid rgba(0, 0, 0, 0.12)' } }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                <Box
                  sx={{ 
                    width: 200, 
                    height: 200, 
                    mb: 2,
                    boxShadow: 3,
                    backgroundImage: `url(${artistImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    borderRadius: '4px',
                    border: '1px solid rgba(0, 0, 0, 0.1)'
                  }}
                />
                
                <Typography variant="h6" align="center" gutterBottom>
                  {artist.name}
                </Typography>
                
                {/* Display label chips */}
                {labelChips && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', mt: 1 }}>
                    {labelChips}
                  </Box>
                )}
                
                {/* Spotify Link */}
                {artist.spotify_url && (
                  <Button 
                    variant="outlined" 
                    color="primary" 
                    href={artist.spotify_url} 
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ mt: 2 }}
                    startIcon={<InfoIcon />}
                  >
                    Listen on Spotify
                  </Button>
                )}
              </Box>
              
              {/* Artist Bio */}
              {artist.bio && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    About
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {artist.bio}
                  </Typography>
                </Box>
              )}
              
              {/* Artist Genres */}
              {artist.genres && artist.genres.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Genres
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {artist.genres.map(genre => (
                      <Chip 
                        key={genre} 
                        label={genre} 
                        size="small" 
                        variant="outlined" 
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          </Grid>
          
          {/* Releases Section */}
          <Grid item xs={12} md={8}>
            <Box sx={{ p: 0 }}>
              {renderReleases()}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

export default ArtistModal;
