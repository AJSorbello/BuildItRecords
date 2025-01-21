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

  const getArtists = (track: Track | null): any[] => {
    if (!track) return [];
    // Log track and artist data
    console.log('Track:', {
      title: track.title,
      label: track.release?.label?.name,
      artists: track.artists?.map(a => ({
        name: a.name,
        id: a.id,
        image_url: a.image_url,
        images: a.images
      })),
      releaseArtists: track.release?.artists?.map(a => ({
        name: a.name,
        id: a.id,
        image_url: a.image_url,
        images: a.images
      }))
    });

    // For album/release headers, always show the original artists
    if (track.release) {
      return track.release?.artists || track.artists || [];
    }

    // For track rows, handle remixes specially
    const isRemix = track.title.toLowerCase().includes('remix');
    if (isRemix) {
      // Try to get remixer name from track title
      const remixerName = extractRemixerFromTitle(track.title);
      if (remixerName) {
        // Find the artist whose name matches the remixer name
        const remixer = track.artists?.find(artist => 
          artist.name.toLowerCase().includes(remixerName.toLowerCase())
        );
        if (remixer) {
          return [remixer];
        }
      }
      // Fallback to using remixer_id if available
      if (track.remixer_id) {
        return track.artists?.filter(artist => artist.id === track.remixer_id) || [];
      }
      // Last resort: show the last artist
      return track.artists?.slice(-1) || [];
    }
    // For regular tracks, show all artists
    return track.artists?.length ? track.artists : track.release?.artists || [];
  };

  const getTrackImage = (track: Track | null): string => {
    if (!track) return '';
    const artists = getArtists(track);
    if (artists.length > 0 && artists[0].image_url) {
      return artists[0].image_url;
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

  const sortedReleases = Object.entries(tracksByRelease).sort(([, a], [, b]) => {
    const dateA = a.release?.release_date ? new Date(a.release.release_date).getTime() : 0;
    const dateB = b.release?.release_date ? new Date(b.release.release_date).getTime() : 0;
    return dateB - dateA;
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
                            {artist.image_url && (
                              <img
                                src={artist.image_url}
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
                        label="Single"
                        color="primary"
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
                      {getArtists(releaseTracks[0]).map((artist) => (
                        <Box key={artist.id} display="flex" alignItems="center" gap={1}>
                          {artist.image_url && (
                            <img
                              src={artist.image_url}
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
                      label="Album"
                      color="secondary"
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
                                        {artist.image_url && (
                                          <img
                                            src={artist.image_url}
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
