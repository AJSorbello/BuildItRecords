import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Box,
  Avatar,
  Typography,
  Tooltip
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { Track } from '../../types/track';

interface TrackManagerProps {
  tracks?: Track[];
  onEditTrack?: (track: Track) => void;
  onDeleteTrack?: (trackId: string) => void;
}

const TrackManager: React.FC<TrackManagerProps> = ({
  tracks = [],
  onEditTrack = () => {},
  onDeleteTrack = () => {},
}) => {
  console.log('TrackManager received tracks:', tracks);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'No date';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const getArtistName = (track: Track) => {
    if (!track) return 'Unknown Artist';
    
    if (Array.isArray(track.artists)) {
      return track.artists.map(artist => {
        if (typeof artist === 'string') return artist;
        return artist.name || 'Unknown Artist';
      }).join(', ');
    }
    
    return 'Unknown Artist';
  };

  const getAlbumCover = (track: Track) => {
    if (!track) return '/placeholder-album.jpg';
    
    if (track.artwork_url) return track.artwork_url;
    if (track.albumCover) return track.albumCover;
    if (track.album?.artwork_url) return track.album.artwork_url;
    if (track.album?.images?.[0]?.url) return track.album.images[0].url;
    
    return '/placeholder-album.jpg';
  };

  if (!Array.isArray(tracks)) {
    console.error('Tracks is not an array:', tracks);
    return (
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Album Art</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Artist</TableCell>
              <TableCell>Album</TableCell>
              <TableCell>Release Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell colSpan={6} align="center">
                <Typography>Invalid tracks data</Typography>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  return (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Album Art</TableCell>
            <TableCell>Title</TableCell>
            <TableCell>Artist</TableCell>
            <TableCell>Album</TableCell>
            <TableCell>Release Date</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tracks.length > 0 ? (
            tracks.map((track) => {
              console.log('Rendering track:', track);
              if (!track || !track.id) {
                console.warn('Invalid track:', track);
                return null;
              }
              return (
                <TableRow key={track.id}>
                  <TableCell>
                    <Avatar
                      src={getAlbumCover(track)}
                      alt={track.name || 'Album Art'}
                      variant="rounded"
                      sx={{ width: 50, height: 50 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1">
                      {track.name || 'Untitled'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography>
                        {getArtistName(track)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography>
                      {track.album?.name || 'No album'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography>
                      {formatDate(track.release_date)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Edit Track">
                        <IconButton
                          onClick={() => onEditTrack(track)}
                          size="small"
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Track">
                        <IconButton
                          onClick={() => onDeleteTrack(track.id)}
                          size="small"
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={6} align="center">
                <Typography>No tracks available. Import some tracks using the Import Releases button above.</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TrackManager;
