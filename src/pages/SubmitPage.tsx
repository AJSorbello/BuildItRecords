import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  Checkbox,
  Grid,
  IconButton,
  TextField,
  Typography,
  Modal,
  FormControlLabel,
  Link,
  BoxProps,
  styled,
} from '@mui/material';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { LABEL_DISPLAY_NAMES } from '../constants/labels';
import config from '../config'; // Assuming config file is in the same directory

interface Track {
  title: string;
  soundCloudPrivateLink: string;
  genre: string;
}

interface Artist {
  fullName: string;
  name: string;
  email: string;
  country: string;
  province: string;
  city: string;
  facebook: string;
  twitter: string;
  instagram: string;
  soundcloud: string;
  spotify: string;
  appleMusic: string;
  hasFacebook: boolean;
  hasTwitter: boolean;
  hasInstagram: boolean;
  hasSoundcloud: boolean;
  hasSpotify: boolean;
  hasAppleMusic: boolean;
}

interface SubmitPageProps {
  label?: string;
}

const StyledCard = styled(Card)({
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  borderRadius: '8px',
  padding: '24px',
});

const FormSection = ({ children, ...props }: { children: React.ReactNode } & BoxProps) => (
  <StyledCard
    sx={{
      marginBottom: '24px',
      ...props.sx
    }}
  >
    {children}
  </StyledCard>
);

const buttonStyle = {
  backgroundColor: '#02FF95',
  color: '#121212',
  '&:hover': {
    backgroundColor: '#00CC76',
  },
};

const SubmitPage: React.FC<SubmitPageProps> = ({ label = 'records' }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [artists, setArtists] = React.useState<Artist[]>([{
    fullName: '',
    name: '',
    email: '',
    country: '',
    province: '',
    city: '',
    facebook: '',
    twitter: '',
    instagram: '',
    soundcloud: '',
    spotify: '',
    appleMusic: '',
    hasFacebook: false,
    hasTwitter: false,
    hasInstagram: false,
    hasSoundcloud: false,
    hasSpotify: false,
    hasAppleMusic: false
  }]);

  const [tracks, setTracks] = React.useState<Track[]>([{
    title: '',
    soundCloudPrivateLink: '',
    genre: '',
  }]);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
      fullName: '',
      name: '',
      email: '',
      country: '',
      province: '',
      city: '',
      facebook: '',
      twitter: '',
      instagram: '',
      soundcloud: '',
      spotify: '',
      appleMusic: '',
      hasFacebook: false,
      hasTwitter: false,
      hasInstagram: false,
      hasSoundcloud: false,
      hasSpotify: false,
      hasAppleMusic: false
    }]);
  };

  const removeArtist = (index: number) => {
    if (artists.length > 1) {
      setArtists(artists.filter((_, i) => i !== index));
    }
  };

  const addTrack = () => {
    setTracks([...tracks, { title: '', soundCloudPrivateLink: '', genre: '' }]);
  };

  const removeTrack = (index: number) => {
    if (tracks.length > 1) {
      setTracks(tracks.filter((_, i) => i !== index));
    }
  };

  const isValidSoundCloudUrl = (url: string) => {
    const regex = /^(https?:\/\/)?(www\.)?(soundcloud\.com|snd\.sc)\/[\w-]+\/[\w-]+$/;
    return regex.test(url);
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const validateSocialMediaUrls = (artist: Artist): string | null => {
    if (artist.hasFacebook && artist.facebook && !isValidUrl(artist.facebook)) {
      return 'Please enter a valid Facebook URL';
    }
    if (artist.hasTwitter && artist.twitter && !isValidUrl(artist.twitter)) {
      return 'Please enter a valid Twitter URL';
    }
    if (artist.hasInstagram && artist.instagram && !isValidUrl(artist.instagram)) {
      return 'Please enter a valid Instagram URL';
    }
    if (artist.hasSoundcloud && artist.soundcloud && !isValidUrl(artist.soundcloud)) {
      return 'Please enter a valid SoundCloud URL';
    }
    if (artist.hasSpotify && artist.spotify && !isValidUrl(artist.spotify)) {
      return 'Please enter a valid Spotify URL';
    }
    if (artist.hasAppleMusic && artist.appleMusic && !isValidUrl(artist.appleMusic)) {
      return 'Please enter a valid Apple Music URL';
    }
    return null;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!termsAccepted) {
      setError('You must accept the terms and conditions to submit.');
      return;
    }

    try {
      const artist = artists[0]; // Assuming single artist for simplicity
      const track = tracks[0]; // Assuming single track for simplicity

      // Validate SoundCloud URL
      if (!isValidSoundCloudUrl(track.soundCloudPrivateLink)) {
        setError('Please enter a valid SoundCloud URL for your track.');
        return;
      }

      // Validate social media URLs
      const socialMediaError = validateSocialMediaUrls(artist);
      if (socialMediaError) {
        setError(socialMediaError);
        return;
      }

      const response = await fetch(`${config.API_URL}/api/submit-demo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          artist: {
            fullName: artist.fullName,
            name: artist.name,
            email: artist.email,
            country: artist.country,
            province: artist.province,
            city: artist.city,
            facebook: artist.hasFacebook ? artist.facebook : null,
            twitter: artist.hasTwitter ? artist.twitter : null,
            instagram: artist.hasInstagram ? artist.instagram : null,
            soundcloud: artist.hasSoundcloud ? artist.soundcloud : null,
            spotify: artist.hasSpotify ? artist.spotify : null,
            appleMusic: artist.hasAppleMusic ? artist.appleMusic : null
          },
          track: {
            name: track.title,
            genre: track.genre,
            soundCloudPrivateLink: track.soundCloudPrivateLink
          }
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit form');
      }

      setSuccess('Demo submitted successfully!');
      // Clear form after successful submission
      setArtists([{
        fullName: '',
        name: '',
        email: '',
        country: '',
        province: '',
        city: '',
        facebook: '',
        twitter: '',
        instagram: '',
        soundcloud: '',
        spotify: '',
        appleMusic: '',
        hasFacebook: false,
        hasTwitter: false,
        hasInstagram: false,
        hasSoundcloud: false,
        hasSpotify: false,
        hasAppleMusic: false
      }]);
      setTracks([{ title: '', soundCloudPrivateLink: '', genre: '' }]);
      setTermsAccepted(false);

    } catch (err) {
      console.error('Submission error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process submission');
    }
  };

  // Get the label display name
  let labelDisplay = 'Build It Records';
  if (label) {
    const labelId = label === 'records' ? 'buildit-records' : 
                   label === 'tech' ? 'buildit-tech' : 
                   label === 'deep' ? 'buildit-deep' : 'buildit-records';
    labelDisplay = LABEL_DISPLAY_NAMES[labelId] || 'Build It Records';
  }

  return (
    <Box 
      component="form" 
      onSubmit={handleSubmit} 
      sx={{ 
        maxWidth: 800, 
        mx: 'auto', 
        p: 3,
        mt: '80px', 
        mb: 4,
      }}
    >
      <Typography variant="h3" component="h1" gutterBottom sx={{ color: 'text.primary', mb: 4 }}>
        Submit Demo to {labelDisplay}
      </Typography>

      <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
        Build It Records is dedicated to showcasing emerging and accomplished underground house music producers. 
        We&apos;re constantly seeking fresh, innovative sounds that push the boundaries of underground electronic music.
      </Typography>

      {/* Artist Information */}
      <Typography variant="h5" gutterBottom sx={{ color: 'text.primary', mt: 4 }}>
        Artist Information
      </Typography>
        
      {artists.map((artist, artistIndex) => (
        <FormSection key={artistIndex}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Artist {artistIndex + 1}</Typography>
            {artists.length > 1 && (
              <IconButton onClick={() => removeArtist(artistIndex)} color="error">
                <RemoveIcon />
              </IconButton>
            )}
          </Box>
            
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Full Name"
                value={artist.fullName}
                onChange={(e) => handleArtistChange(artistIndex, 'fullName', e.target.value)}
                required
                id={`artist-fullname-${artistIndex}`}
                name={`artist-fullname-${artistIndex}`}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Artist Name"
                value={artist.name}
                onChange={(e) => handleArtistChange(artistIndex, 'name', e.target.value)}
                required
                id={`artist-name-${artistIndex}`}
                name={`artist-name-${artistIndex}`}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={artist.email}
                onChange={(e) => handleArtistChange(artistIndex, 'email', e.target.value)}
                required
                id={`artist-email-${artistIndex}`}
                name={`artist-email-${artistIndex}`}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Country"
                value={artist.country}
                onChange={(e) => handleArtistChange(artistIndex, 'country', e.target.value)}
                required
                id={`artist-country-${artistIndex}`}
                name={`artist-country-${artistIndex}`}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="City"
                value={artist.city}
                onChange={(e) => handleArtistChange(artistIndex, 'city', e.target.value)}
                required
                id={`artist-city-${artistIndex}`}
                name={`artist-city-${artistIndex}`}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Province/State"
                value={artist.province}
                onChange={(e) => handleArtistChange(artistIndex, 'province', e.target.value)}
                required
                id={`artist-province-${artistIndex}`}
                name={`artist-province-${artistIndex}`}
              />
            </Grid>
          </Grid>

          <Typography variant="subtitle1" sx={{ mt: 3, mb: 2 }}>
            Social Media Links
          </Typography>
            
          <Grid container spacing={2}>
            {/* Facebook */}
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TextField
                  fullWidth
                  label="Facebook URL"
                  value={artist.facebook}
                  onChange={(e) => handleArtistChange(artistIndex, 'facebook', e.target.value)}
                  error={!artist.hasFacebook && artist.facebook === ''}
                  helperText={!artist.hasFacebook && artist.facebook === '' ? 'Required unless checked as not available' : ''}
                  disabled={artist.hasFacebook}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={artist.hasFacebook}
                      onChange={(e) => handleArtistChange(artistIndex, 'hasFacebook', e.target.checked)}
                    />
                  }
                  label="Don't have"
                  sx={{ minWidth: '100px', ml: 1 }}
                />
              </Box>
            </Grid>

            {/* Twitter */}
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TextField
                  fullWidth
                  label="Twitter URL"
                  value={artist.twitter}
                  onChange={(e) => handleArtistChange(artistIndex, 'twitter', e.target.value)}
                  error={!artist.hasTwitter && artist.twitter === ''}
                  helperText={!artist.hasTwitter && artist.twitter === '' ? 'Required unless checked as not available' : ''}
                  disabled={artist.hasTwitter}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={artist.hasTwitter}
                      onChange={(e) => handleArtistChange(artistIndex, 'hasTwitter', e.target.checked)}
                    />
                  }
                  label="Don't have"
                  sx={{ minWidth: '100px', ml: 1 }}
                />
              </Box>
            </Grid>

            {/* Instagram */}
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TextField
                  fullWidth
                  label="Instagram URL"
                  value={artist.instagram}
                  onChange={(e) => handleArtistChange(artistIndex, 'instagram', e.target.value)}
                  error={!artist.hasInstagram && artist.instagram === ''}
                  helperText={!artist.hasInstagram && artist.instagram === '' ? 'Required unless checked as not available' : ''}
                  disabled={artist.hasInstagram}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={artist.hasInstagram}
                      onChange={(e) => handleArtistChange(artistIndex, 'hasInstagram', e.target.checked)}
                    />
                  }
                  label="Don't have"
                  sx={{ minWidth: '100px', ml: 1 }}
                />
              </Box>
            </Grid>

            {/* SoundCloud */}
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TextField
                  fullWidth
                  label="SoundCloud URL"
                  value={artist.soundcloud}
                  onChange={(e) => handleArtistChange(artistIndex, 'soundcloud', e.target.value)}
                  error={!artist.hasSoundcloud && artist.soundcloud === ''}
                  helperText={!artist.hasSoundcloud && artist.soundcloud === '' ? 'Required unless checked as not available' : ''}
                  disabled={artist.hasSoundcloud}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={artist.hasSoundcloud}
                      onChange={(e) => handleArtistChange(artistIndex, 'hasSoundcloud', e.target.checked)}
                    />
                  }
                  label="Don't have"
                  sx={{ minWidth: '100px', ml: 1 }}
                />
              </Box>
            </Grid>

            {/* Spotify */}
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TextField
                  fullWidth
                  label="Spotify URL"
                  value={artist.spotify}
                  onChange={(e) => handleArtistChange(artistIndex, 'spotify', e.target.value)}
                  error={!artist.hasSpotify && artist.spotify === ''}
                  helperText={!artist.hasSpotify && artist.spotify === '' ? 'Required unless checked as not available' : ''}
                  disabled={artist.hasSpotify}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={artist.hasSpotify}
                      onChange={(e) => handleArtistChange(artistIndex, 'hasSpotify', e.target.checked)}
                    />
                  }
                  label="Don't have"
                  sx={{ minWidth: '100px', ml: 1 }}
                />
              </Box>
            </Grid>

            {/* Apple Music */}
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TextField
                  fullWidth
                  label="Apple Music URL"
                  value={artist.appleMusic}
                  onChange={(e) => handleArtistChange(artistIndex, 'appleMusic', e.target.value)}
                  error={!artist.hasAppleMusic && artist.appleMusic === ''}
                  helperText={!artist.hasAppleMusic && artist.appleMusic === '' ? 'Required unless checked as not available' : ''}
                  disabled={artist.hasAppleMusic}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={artist.hasAppleMusic}
                      onChange={(e) => handleArtistChange(artistIndex, 'hasAppleMusic', e.target.checked)}
                    />
                  }
                  label="Don't have"
                  sx={{ minWidth: '100px', ml: 1 }}
                />
              </Box>
            </Grid>
          </Grid>
        </FormSection>
      ))}

      <Box sx={{ mb: 4 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={addArtist}
          sx={buttonStyle}
        >
          Add Artist
        </Button>
      </Box>

      {/* Track Information */}
      <Typography variant="h5" gutterBottom sx={{ color: 'text.primary', mt: 4 }}>
        Track Information
      </Typography>

      {tracks.map((track, index) => (
        <FormSection key={index}>
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
                label="Track Name"
                value={track.title}
                onChange={(e) => handleTrackChange(index, 'title', e.target.value)}
                required
                id={`track-title-${index}`}
                name={`track-title-${index}`}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Genre"
                value={track.genre}
                onChange={(e) => handleTrackChange(index, 'genre', e.target.value)}
                required
                helperText="e.g., Deep House, Tech House, Progressive House"
                id={`track-genre-${index}`}
                name={`track-genre-${index}`}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="SoundCloud Private Link"
                value={track.soundCloudPrivateLink}
                onChange={(e) => handleTrackChange(index, 'soundCloudPrivateLink', e.target.value)}
                required
                helperText="Please provide a private SoundCloud link for your track"
                id={`track-soundcloud-${index}`}
                name={`track-soundcloud-${index}`}
              />
            </Grid>
          </Grid>
        </FormSection>
      ))}

      <Box sx={{ mb: 4 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={addTrack}
          sx={buttonStyle}
        >
          Add Track
        </Button>
      </Box>

      <Box sx={{ mt: 6, mb: 4 }}>
        <FormSection>
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
        </FormSection>
      </Box>

      <Box sx={{ mt: 4 }}>
        <FormControlLabel
          control={
            <Checkbox 
              checked={termsAccepted}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTermsAccepted(e.target.checked)}
              sx={{
                color: '#02FF95',
                '&.Mui-checked': {
                  color: '#02FF95',
                },
              }}
              id="terms-checkbox"
              name="terms-checkbox"
            />
          }
          label={
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              I accept the{' '}
              <Link 
                href="/legal" 
                target="_blank"
                sx={{ 
                  color: '#02FF95',
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                Terms of Service and Privacy Policy
              </Link>
            </Typography>
          }
        />
        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          disabled={!termsAccepted}
          sx={{
            ...buttonStyle,
            mt: 2,
            opacity: termsAccepted ? 1 : 0.5,
          }}
        >
          Submit Demo
        </Button>
        {error && (
          <Typography variant="body2" sx={{ color: 'error.main', mt: 2 }}>
            {error}
          </Typography>
        )}
        {success && (
          <Typography variant="body2" sx={{ color: 'success.main', mt: 2 }}>
            {success}
          </Typography>
        )}
      </Box>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'background.paper',
          border: '2px solid #000',
          boxShadow: 24,
          p: 4,
        }}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Demo Submission Successful
          </Typography>
          <Typography id="modal-modal-description" sx={{ mt: 2 }}>
            Your demo has been submitted successfully. We will review it and get back to you within 7 days.
          </Typography>
        </Box>
      </Modal>
    </Box>
  );
};

export default SubmitPage;
