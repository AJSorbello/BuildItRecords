import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  IconButton,
  styled,
  SelectChangeEvent,
} from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material';
import PageLayout from '../components/PageLayout';
import { useParams } from 'react-router-dom';

const StyledCard = styled(Card)({
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  marginBottom: '24px',
});

const StyledButton = styled(Button)({
  backgroundColor: '#02FF95',
  color: '#121212',
  '&:hover': {
    backgroundColor: '#00CC76',
  },
});

interface Track {
  title: string;
  soundCloudLink: string;
  genre: string;
}

interface Artist {
  name: string;
  fullName: string;
  email: string;
  country: string;
  province: string;
  facebook: string;
  twitter: string;
  instagram: string;
  soundcloud: string;
  spotify: string;
  appleMusic: string;
}

const SubmitPage = () => {
  const { label = 'records' } = useParams<{ label?: string }>();
  const [artists, setArtists] = useState<Artist[]>([{
    name: '',
    fullName: '',
    email: '',
    country: '',
    province: '',
    facebook: '',
    twitter: '',
    instagram: '',
    soundcloud: '',
    spotify: '',
    appleMusic: '',
  }]);

  const [tracks, setTracks] = useState<Track[]>([{
    title: '',
    soundCloudLink: '',
    genre: '',
  }]);

  const handleArtistChange = (index: number, field: keyof Artist, value: string) => {
    const newArtists = [...artists];
    newArtists[index] = { ...newArtists[index], [field]: value };
    setArtists(newArtists);
  };

  const handleTrackChange = (index: number, field: keyof Track, value: string) => {
    const newTracks = [...tracks];
    newTracks[index] = { ...newTracks[index], [field]: value };
    setTracks(newTracks);
  };

  const addArtist = () => {
    setArtists([...artists, {
      name: '',
      fullName: '',
      email: '',
      country: '',
      province: '',
      facebook: '',
      twitter: '',
      instagram: '',
      soundcloud: '',
      spotify: '',
      appleMusic: '',
    }]);
  };

  const removeArtist = (index: number) => {
    if (artists.length > 1) {
      const newArtists = [...artists];
      newArtists.splice(index, 1);
      setArtists(newArtists);
    }
  };

  const addTrack = () => {
    setTracks([...tracks, {
      title: '',
      soundCloudLink: '',
      genre: '',
    }]);
  };

  const removeTrack = (index: number) => {
    if (tracks.length > 1) {
      const newTracks = [...tracks];
      newTracks.splice(index, 1);
      setTracks(newTracks);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Handle form submission
    console.log({ artists, tracks });
  };

  return (
    <PageLayout label={label as 'records' | 'tech' | 'deep'}>
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '24px',
        }}
      >
        <Typography variant="h4" gutterBottom sx={{ color: 'text.primary', mb: 2 }}>
          Submit Demo to Build It {label.charAt(0).toUpperCase() + label.slice(1)}
        </Typography>

        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
          Build It Records is dedicated to showcasing emerging and accomplished underground house music producers. 
          We&apos;re constantly seeking fresh, innovative sounds that push the boundaries of underground electronic music.
        </Typography>

        {/* Artist Information */}
        <Typography variant="h5" gutterBottom sx={{ color: 'text.primary', mt: 4 }}>
          Artist Information
        </Typography>
        
        {artists.map((artist, index) => (
          <StyledCard key={index}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Artist {index + 1}</Typography>
                {artists.length > 1 && (
                  <IconButton onClick={() => removeArtist(index)} color="error">
                    <RemoveIcon />
                  </IconButton>
                )}
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Artist Name"
                    value={artist.name}
                    onChange={(e) => handleArtistChange(index, 'name', e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={artist.fullName}
                    onChange={(e) => handleArtistChange(index, 'fullName', e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={artist.email}
                    onChange={(e) => handleArtistChange(index, 'email', e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Country"
                    value={artist.country}
                    onChange={(e) => handleArtistChange(index, 'country', e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Province/State"
                    value={artist.province}
                    onChange={(e) => handleArtistChange(index, 'province', e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Social Media Links
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Facebook"
                    value={artist.facebook}
                    onChange={(e) => handleArtistChange(index, 'facebook', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Twitter/X"
                    value={artist.twitter}
                    onChange={(e) => handleArtistChange(index, 'twitter', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Instagram"
                    value={artist.instagram}
                    onChange={(e) => handleArtistChange(index, 'instagram', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="SoundCloud"
                    value={artist.soundcloud}
                    onChange={(e) => handleArtistChange(index, 'soundcloud', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Spotify"
                    value={artist.spotify}
                    onChange={(e) => handleArtistChange(index, 'spotify', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Apple Music"
                    value={artist.appleMusic}
                    onChange={(e) => handleArtistChange(index, 'appleMusic', e.target.value)}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </StyledCard>
        ))}

        <Box sx={{ mb: 4 }}>
          <StyledButton
            variant="contained"
            startIcon={<AddIcon />}
            onClick={addArtist}
          >
            Add Artist
          </StyledButton>
        </Box>

        {/* Track Information */}
        <Typography variant="h5" gutterBottom sx={{ color: 'text.primary', mt: 4 }}>
          Track Information
        </Typography>

        {tracks.map((track, index) => (
          <StyledCard key={index}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Track {index + 1}</Typography>
                {tracks.length > 1 && (
                  <IconButton onClick={() => removeTrack(index)} color="error">
                    <RemoveIcon />
                  </IconButton>
                )}
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Track Title"
                    value={track.title}
                    onChange={(e) => handleTrackChange(index, 'title', e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel id={`genre-label-${index}`}>Genre</InputLabel>
                    <Select
                      labelId={`genre-label-${index}`}
                      value={track.genre}
                      onChange={(e: SelectChangeEvent) => handleTrackChange(index, 'genre', e.target.value)}
                      label="Genre"
                    >
                      <MenuItem value="house">House</MenuItem>
                      <MenuItem value="techno">Techno</MenuItem>
                      <MenuItem value="deep-house">Deep House</MenuItem>
                      <MenuItem value="tech-house">Tech House</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="SoundCloud Private Link"
                    value={track.soundCloudLink}
                    onChange={(e) => handleTrackChange(index, 'soundCloudLink', e.target.value)}
                    required
                    helperText="Please provide a private SoundCloud link for your track"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </StyledCard>
        ))}

        <Box sx={{ mb: 4 }}>
          <StyledButton
            variant="contained"
            startIcon={<AddIcon />}
            onClick={addTrack}
          >
            Add Track
          </StyledButton>
        </Box>

        <Box sx={{ mt: 6, mb: 4 }}>
          <StyledCard>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: 'text.primary' }}>
                Submission Guidelines & Terms
              </Typography>
              <Typography variant="body2" component="div" sx={{ color: 'text.secondary' }}>
                • Please allow up to 7 days for us to review your submission<br />
                • All submissions must be 100% royalty-free or will be rejected immediately<br />
                • Royalties are split 50/50 between artists and label<br />
                • Only submit unreleased, original material<br />
                • We accept demos in WAV format only - premasters no limiters on master/stereo bus<br />
                • By submitting, you confirm that this is original work and you own all rights
              </Typography>
            </CardContent>
          </StyledCard>
        </Box>

        <Box sx={{ mt: 4 }}>
          <StyledButton
            type="submit"
            variant="contained"
            size="large"
            fullWidth
          >
            Submit Demo
          </StyledButton>
        </Box>
      </Box>
    </PageLayout>
  );
};

export default SubmitPage;
