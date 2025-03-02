import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  Box,
  Collapse,
  Chip,
  List,
  ListItem,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { Track } from '../../types/track';

interface TrackManagerProps {
  tracks?: Track[];
  onEdit?: (track: Track) => void;
  onDelete?: (trackId: string) => void;
}

// Column widths for consistent layout
const COLUMN_WIDTHS = {
  artwork: 80,  // Width for artwork column
  track: '30%', // Track name column
  artists: '40%', // Artists column
  duration: 100, // Duration column
  type: 100,    // Single/Album indicator column
  date: 120,    // Release date column
};

const TrackManager: React.FC<TrackManagerProps> = ({
  tracks = [],
  onEdit = () => {},
  onDelete = () => {},
}) => {
  const [expandedTrack, setExpandedTrack] = useState<string | null>(null);

  const getArtistNames = (track: Track): string => {
    const artists = track.artists?.length ? track.artists : track.release?.artists;
    if (!artists?.length) return 'Unknown Artist';
    return artists.map(artist => artist.name || 'Unknown Artist').join(', ');
  };

  const extractRemixerFromTitle = (trackTitle: string): string | null => {
    // Match pattern: "- Name Remix" or "Name Remix"
    const remixMatch = trackTitle.match(/[-\s]([^-]+)\s+Remix/i);
    return remixMatch ? remixMatch[1].trim() : null;
  };

  const getArtists = (track: Track | null, isHeader: boolean = false): any[] => {
    if (!track) return [];

    // For album/release headers, always show the original artist (Kwal)
    if (isHeader) {
      return track.release?.artists || [];
    }

    // For remix tracks, show only the remixer
    const isRemix = track.title?.toLowerCase().includes('remix');
    if (isRemix) {
      const remixerName = extractRemixerFromTitle(track.title);
      if (remixerName) {
        // Try to find remixer in track's artists
        const remixer = track.artists?.find(artist => 
          artist.name.toLowerCase().includes(remixerName.toLowerCase())
        );
        if (remixer) {
          return [remixer];
        }
        // If not found in track artists, try to find in all artists
        const allArtists = tracks.flatMap(t => t.artists || []);
        const remixerFromAll = allArtists.find(artist => 
          artist.name.toLowerCase().includes(remixerName.toLowerCase())
        );
        if (remixerFromAll) {
          return [remixerFromAll];
        }
      }
      // Fallback to remixer_id
      if (track.remixer_id) {
        const allArtists = tracks.flatMap(t => t.artists || []);
        const remixer = allArtists.find(artist => artist.id === track.remixer_id);
        if (remixer) {
          return [remixer];
        }
      }
    }

    // For regular tracks, show the original artist
    return track.artists || track.release?.artists || [];
  };

  const getArtistImage = (artist: any): string => {
    return artist.profile_image_url || 
           artist.profile_image_small_url || 
           artist.profile_image_large_url || 
           (artist.images && artist.images[0]?.url) || 
           '/images/placeholder-artist.jpg';
  };

  const getTrackImage = (track: Track | null): string => {
    if (!track) return '';
    const artists = getArtists(track);
    if (artists.length > 0 && getArtistImage(artists[0])) {
      return getArtistImage(artists[0]);
    }
    return track.artwork_url || track.images?.[0]?.url || '';
  };

  const formatDuration = (ms: number | undefined): string => {
    if (!ms || typeof ms !== 'number') return '0:00';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: string | undefined): string => {
    if (!date) return 'No date';
    
    try {
      const dateObj = typeof date === 'number' ? new Date(date) : new Date(date);
      
      if (isNaN(dateObj.getTime())) {
        console.error('Invalid date:', date);
        return 'Invalid date';
      }
      
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Error';
    }
  };

  const getReleaseType = (release: any, tracks: Track[]): { label: string; color: "primary" | "secondary" | "success" | "info" } => {
    // Check for compilation first
    if (release?.type === 'compilation' || 
        (release?.name && release.name.toLowerCase().includes('compilation')) ||
        (release?.name && release.name.toLowerCase().includes('various artists'))) {
      return { label: 'Compilation', color: 'secondary' };
    }

    const totalTracks = tracks.length;
    
    // Singles are typically 1-3 tracks
    if (totalTracks <= 3) {
      return { label: 'Single', color: 'primary' };
    }
    
    // EPs are typically 4-6 tracks
    if (totalTracks <= 6) {
      return { label: 'EP', color: 'info' };
    }
    
    // Albums are 7+ tracks
    return { label: 'Album', color: 'success' };
  };

  // Group tracks by release and sort by date
  const tracksByRelease = tracks.reduce((acc, track) => {
    const releaseId = track.release?.id || 'unknown';
    if (!acc[releaseId]) {
      acc[releaseId] = {
        release: track.release,
        tracks: []
      };
    }
    acc[releaseId].tracks.push(track);
    return acc;
  }, {} as Record<string, { release: Track['release']; tracks: Track[] }>);

  // Sort releases by date and sort tracks within each release
  const sortedReleases = Object.entries(tracksByRelease).sort(([, a], [, b]) => {
    const dateA = a.release?.release_date ? new Date(a.release.release_date).getTime() : 0;
    const dateB = b.release?.release_date ? new Date(b.release.release_date).getTime() : 0;
    return dateB - dateA;
  }).map(([id, data]) => {
    // Sort tracks: original versions first, then remixes
    const sortedTracks = [...data.tracks].sort((a, b) => {
      const aIsRemix = a.title?.toLowerCase().includes('remix');
      const bIsRemix = b.title?.toLowerCase().includes('remix');
      
      if (aIsRemix && !bIsRemix) return 1;  // Remixes go after
      if (!aIsRemix && bIsRemix) return -1; // Originals go first
      
      // For tracks of the same type (both remix or both original)
      // Sort by title
      return (a.title || '').localeCompare(b.title || '');
    });

    return [id, { ...data, tracks: sortedTracks }] as const;
  });

  if (!tracks || !Array.isArray(tracks) || tracks.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="textSecondary">
          No tracks available
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {sortedReleases.map(([releaseId, { release, tracks: releaseTracks }]) => {
        const isSingle = releaseTracks.length === 1;
        const track = isSingle ? releaseTracks[0] : null;

        if (isSingle) {
          // Render single track row
          return (
            <TableContainer key={releaseId} component={Paper} sx={{ mb: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell width={COLUMN_WIDTHS.track}>Track</TableCell>
                    <TableCell width={COLUMN_WIDTHS.artists}>Artists</TableCell>
                    <TableCell width={COLUMN_WIDTHS.duration} align="right">Duration</TableCell>
                    <TableCell width={COLUMN_WIDTHS.type} align="center">Type</TableCell>
                    <TableCell width={COLUMN_WIDTHS.date} align="right">Release Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        {release?.artwork_url && (
                          <img
                            src={release.artwork_url}
                            alt={release.title}
                            style={{
                              width: COLUMN_WIDTHS.artwork - 20,
                              height: COLUMN_WIDTHS.artwork - 20,
                              borderRadius: 4,
                              objectFit: 'cover'
                            }}
                          />
                        )}
                        <Box>
                          <Typography variant="subtitle1">{track?.title || 'Untitled'}</Typography>
                          {track?.spotify_url && (
                            <Typography
                              variant="body2"
                              color="textSecondary"
                              component="a"
                              href={track.spotify_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              sx={{ textDecoration: 'none' }}
                            >
                              Open in Spotify
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        {getArtists(track).map((artist) => (
                          <Box key={artist.id} display="flex" alignItems="center" gap={1}>
                            {getArtistImage(artist) && (
                              <img
                                src={getArtistImage(artist)}
                                alt={artist.name}
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: '50%',
                                  objectFit: 'cover'
                                }}
                              />
                            )}
                            <Typography variant="body2">{artist.name}</Typography>
                          </Box>
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {formatDuration(track?.duration)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={getReleaseType(release, releaseTracks).label}
                        color={getReleaseType(release, releaseTracks).color}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="textSecondary" sx={{ whiteSpace: 'nowrap' }}>
                        {formatDate(release?.release_date)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          );
        }

        // Render album with expandable tracks
        return (
          <TableContainer key={releaseId} component={Paper} sx={{ mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell width={COLUMN_WIDTHS.track}>Track</TableCell>
                  <TableCell width={COLUMN_WIDTHS.artists}>Artists</TableCell>
                  <TableCell width={COLUMN_WIDTHS.duration} align="right">Duration</TableCell>
                  <TableCell width={COLUMN_WIDTHS.type} align="center">Type</TableCell>
                  <TableCell width={COLUMN_WIDTHS.date} align="right">Release Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <Box 
                      display="flex" 
                      alignItems="center" 
                      gap={2}
                      onClick={() => setExpandedTrack(expandedTrack === releaseId ? null : releaseId)}
                      sx={{ cursor: 'pointer' }}
                    >
                      {release?.artwork_url && (
                        <img
                          src={release.artwork_url}
                          alt={release.title}
                          style={{
                            width: COLUMN_WIDTHS.artwork - 20,
                            height: COLUMN_WIDTHS.artwork - 20,
                            borderRadius: 4,
                            objectFit: 'cover'
                          }}
                        />
                      )}
                      <Box>
                        <Typography variant="subtitle1">{release?.title || 'Unknown Album'}</Typography>
                        <Typography variant="body2" color="textSecondary">
                          {releaseTracks.length} tracks
                        </Typography>
                      </Box>
                      <IconButton size="small">
                        <ExpandMoreIcon 
                          sx={{ 
                            transform: expandedTrack === releaseId ? 'rotate(180deg)' : 'rotate(0)',
                            transition: 'transform 0.3s'
                          }} 
                        />
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      {getArtists(releaseTracks[0], true).map((artist) => (
                        <Box key={artist.id} display="flex" alignItems="center" gap={1}>
                          {getArtistImage(artist) && (
                            <img
                              src={getArtistImage(artist)}
                              alt={artist.name}
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                objectFit: 'cover'
                              }}
                            />
                          )}
                          <Typography variant="body2">{artist.name}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {formatDuration(releaseTracks.reduce((total, track) => total + (track.duration || 0), 0))}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={getReleaseType(release, releaseTracks).label}
                      color={getReleaseType(release, releaseTracks).color}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color="textSecondary" sx={{ whiteSpace: 'nowrap' }}>
                      {formatDate(release?.release_date)}
                    </Typography>
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell colSpan={5} sx={{ p: 0, border: 0 }}>
                    <Collapse in={expandedTrack === releaseId}>
                      <Box sx={{ py: 2 }}>
                        <Table size="small">
                          <TableBody>
                            {releaseTracks.map((track) => (
                              <TableRow key={track.id}>
                                <TableCell width={COLUMN_WIDTHS.track}>
                                  <Box sx={{ pl: 7 }}>
                                    <Typography variant="subtitle1">{track.title || 'Untitled'}</Typography>
                                    {track.spotify_url && (
                                      <Typography
                                        variant="body2"
                                        color="textSecondary"
                                        component="a"
                                        href={track.spotify_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        sx={{ textDecoration: 'none' }}
                                      >
                                        Open in Spotify
                                      </Typography>
                                    )}
                                  </Box>
                                </TableCell>
                                <TableCell width={COLUMN_WIDTHS.artists}>
                                  <Box display="flex" alignItems="center" gap={1}>
                                    {getArtists(track).map((artist) => (
                                      <Box key={artist.id} display="flex" alignItems="center" gap={1}>
                                        {getArtistImage(artist) && (
                                          <img
                                            src={getArtistImage(artist)}
                                            alt={artist.name}
                                            style={{
                                              width: 32,
                                              height: 32,
                                              borderRadius: '50%',
                                              objectFit: 'cover'
                                            }}
                                          />
                                        )}
                                        <Typography variant="body2">{artist.name}</Typography>
                                      </Box>
                                    ))}
                                  </Box>
                                </TableCell>
                                <TableCell width={COLUMN_WIDTHS.duration} align="right">
                                  <Typography variant="body2">
                                    {formatDuration(track.duration)}
                                  </Typography>
                                </TableCell>
                                <TableCell width={COLUMN_WIDTHS.type} />
                                <TableCell width={COLUMN_WIDTHS.date} />
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        );
      })}
    </Box>
  );
};

export default TrackManager;
