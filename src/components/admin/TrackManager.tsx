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
  Typography,
  Box
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { Track } from '../../types/track';

interface TrackManagerProps {
  tracks?: Track[];
  onEdit?: (track: Track) => void;
  onDelete?: (trackId: string) => void;
}

const TrackManager: React.FC<TrackManagerProps> = ({
  tracks = [],
  onEdit = () => {},
  onDelete = () => {},
}) => {
  const getArtistNames = (track: Track): string => {
    if (!track.artists) return 'Unknown Artist';
    return track.artists.map(artist => artist.name || 'Unknown Artist').join(', ');
  };

  const formatDuration = (ms: number | undefined): string => {
    if (!ms) return '0:00';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: string | undefined): string => {
    console.log('Formatting date:', date, typeof date);
    if (!date) return 'No date';
    
    try {
      // Handle both ISO dates and Unix timestamps
      const dateObj = typeof date === 'number' ? new Date(date) : new Date(date);
      
      if (isNaN(dateObj.getTime())) {
        console.error('Invalid date:', date);
        return 'Invalid date';
      }
      
      const formattedDate = dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      console.log('Formatted date:', formattedDate);
      return formattedDate;
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Error';
    }
  };

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
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Track Name</TableCell>
            <TableCell>Artists</TableCell>
            <TableCell>Duration</TableCell>
            <TableCell>Release Date</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tracks.map((track) => (
            <TableRow key={track.id}>
              <TableCell>
                <Box display="flex" alignItems="center">
                  {track.artwork_url && (
                    <img
                      src={track.artwork_url}
                      alt={track.name}
                      style={{
                        width: 40,
                        height: 40,
                        marginRight: 10,
                        borderRadius: 4
                      }}
                    />
                  )}
                  <Box>
                    <Typography variant="body1">{track.name || 'Untitled'}</Typography>
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
                </Box>
              </TableCell>
              <TableCell>
                <Box display="flex" alignItems="center" gap={1}>
                  {track.artists?.map((artist) => (
                    <Box key={artist.id} display="flex" alignItems="center" gap={1}>
                      {artist.profile_image && (
                        <img
                          src={artist.profile_image}
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
              <TableCell>{formatDuration(track.duration_ms)}</TableCell>
              <TableCell>{formatDate(track.release_date)}</TableCell>
              <TableCell>
                <IconButton
                  onClick={() => onEdit(track)}
                  size="small"
                  sx={{ mr: 1 }}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  onClick={() => onDelete(track.id)}
                  size="small"
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TrackManager;
