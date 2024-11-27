import React, { useState } from 'react';
import {
  Box,
  TextField,
  Typography,
  Grid,
  IconButton,
  Button,
  Card,
  CardContent,
  Modal,
} from '@mui/material';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import emailjs from 'emailjs-com';
import { useNavigate } from 'react-router-dom';

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
  facebook: string;
  twitter: string;
  instagram: string;
  soundcloud: string;
  spotify: string;
  appleMusic: string;
}

interface SubmitPageProps {
  label: 'records' | 'tech' | 'deep';
}

interface StyledCardProps extends React.ComponentProps<typeof Card> {
  children: React.ReactNode;
}

const StyledCard = ({ children, ...props }: StyledCardProps) => (
  <Card 
    {...props} 
    sx={{ 
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      marginBottom: '24px',
      ...props.sx
    }}
  >
    {children}
  </Card>
);

const buttonStyle = {
  backgroundColor: '#02FF95',
  color: '#121212',
  '&:hover': {
    backgroundColor: '#00CC76',
  },
};

const SubmitPage: React.FC<SubmitPageProps> = ({ label }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [artists, setArtists] = React.useState<Artist[]>([{
    fullName: '',
    name: '',
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

  const [tracks, setTracks] = React.useState<Track[]>([{
    title: '',
    soundCloudPrivateLink: '',
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
      fullName: '',
      name: '',
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

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const artist = artists[0]; // Assuming single artist for simplicity
    const track = tracks[0]; // Assuming single track for simplicity

    if (!isValidSoundCloudUrl(track.soundCloudPrivateLink)) {
      alert('Please enter a valid SoundCloud URL.');
      return;
    }

    const templateParams = {
      to_name: 'aj@builditrecords.com, anmol@builditrecords.com',
      from_name: artist.fullName,
      subject: `${artist.name} - ${track.genre} Demo`,
      message: `Hello,

You got a new demo submission from ${artist.fullName} (${artist.name}):

Genre: ${track.genre}

Links:
SoundCloud: ${artist.soundcloud}
Spotify: ${artist.spotify}
Apple Music: ${artist.appleMusic}

Thank you for your submission, we will review it for consideration.

Best wishes,
Build It Records Team`,
    };

    console.log('Sending email with params:', templateParams);

    emailjs.send('service_gpfw0y4', 'template_6e0uiti', templateParams, 'mYG6-dFf7ymn__f8U')
      .then((response) => {
        console.log('Email sent successfully!', response.status, response.text);
        setOpen(true); // Open modal on success
        setTimeout(() => {
          console.log('Closing modal and redirecting to home.');
          setOpen(false);
          navigate('/'); // Redirect to home
        }, 3000);
      }, (err) => {
        console.log('Failed to send email:', err);
      });
  };

  const labelDisplay = label.charAt(0).toUpperCase() + label.slice(1);

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h3" component="h1" gutterBottom sx={{ color: 'text.primary', mb: 4 }}>
        Submit Demo to Build It {labelDisplay}
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
                  label="Full Name"
                  value={artist.fullName}
                  onChange={(e) => handleArtistChange(index, 'fullName', e.target.value)}
                  required
                />
              </Grid>
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
                <TextField
                  fullWidth
                  label="Genre"
                  value={track.genre}
                  onChange={(e) => handleTrackChange(index, 'genre', e.target.value)}
                  required
                  helperText="e.g., Deep House, Tech House, Progressive House"
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
                />
              </Grid>
            </Grid>
          </CardContent>
        </StyledCard>
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
        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          sx={buttonStyle}
        >
          Submit Demo
        </Button>
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
