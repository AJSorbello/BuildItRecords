import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Box,
  Typography,
  IconButton,
  Tooltip,
  Grid,
  TextField,
  Button,
  CircularProgress
} from '@mui/material';
import { PlayArrow, Pause, Search as SearchIcon } from '@mui/icons-material';
import { Track } from '../../types/models';
import { databaseService } from '../../services/DatabaseService';

interface TrackManagerProps {
  labelId?: string;
  tracks: Track[];
  onEdit?: () => Promise<void>;
  onDelete?: () => Promise<void>;
}

const TrackManager: React.FC<TrackManagerProps> = ({ labelId, tracks = [], onEdit, onDelete }) => {
  const [playingTrackId, setPlayingTrackId] = React.useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = (track: Track) => {
    if (!track?.preview_url) return;
    
    if (playingTrackId === track.id) {
      audioRef.current?.pause();
      setPlayingTrackId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(track.preview_url);
      audioRef.current.play();
      setPlayingTrackId(track.id);
    }
  };

  const handleSearch = async () => {
    if (!labelId) return;
    
    try {
      setLoading(true);
      setError(null);
      const results = await databaseService.getTracks(labelId);
      if (onEdit) await onEdit();
    } catch (err) {
      console.error('Error searching tracks:', err);
      setError(err instanceof Error ? err.message : 'Failed to search tracks');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search tracks..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              onKeyPress={(e: React.KeyboardEvent) => e.key === 'Enter' && handleSearch()}
              InputProps={{
                endAdornment: <SearchIcon />
              }}
            />
            <Button
              variant="contained"
              onClick={handleSearch}
              disabled={loading}
            >
              Search
            </Button>
          </Box>
        </Grid>

        <Grid item xs={12}>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}

          {!loading && tracks && tracks.length > 0 && (
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 650 }} aria-label="tracks table">
                <TableHead>
                  <TableRow>
                    <TableCell>Album</TableCell>
                    <TableCell>Track</TableCell>
                    <TableCell>Artist</TableCell>
                    <TableCell align="right">Duration</TableCell>
                    <TableCell align="right">Preview</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tracks.map((track) => track && (
                    <TableRow
                      key={track.id}
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar
                            variant="rounded"
                            src={track.album?.images?.[0]?.url}
                            alt={track.album?.name || ''}
                            sx={{ width: 56, height: 56, marginRight: 2 }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1" component="div">
                          {track.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {track.album?.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {track.artists?.map((artist, index) => artist && (
                            <Box
                              key={artist.id}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                marginRight: 1
                              }}
                            >
                              <Avatar
                                src={artist.images?.[0]?.url}
                                alt={artist.name}
                                sx={{ width: 32, height: 32, marginRight: 1 }}
                              />
                              <Typography>
                                {artist.name}
                                {index < (track.artists?.length || 0) - 1 ? ', ' : ''}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        {formatDuration(track.duration_ms || 0)}
                      </TableCell>
                      <TableCell align="right">
                        {track.preview_url ? (
                          <Tooltip title={playingTrackId === track.id ? 'Pause' : 'Play Preview'}>
                            <IconButton
                              onClick={() => handlePlayPause(track)}
                              color={playingTrackId === track.id ? 'primary' : 'default'}
                            >
                              {playingTrackId === track.id ? <Pause /> : <PlayArrow />}
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            No preview
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default TrackManager;
