import React from 'react';
import { Box, Typography, Container, Paper, TextField, Button, Grid } from '@mui/material';
import { useParams } from 'react-router-dom';
import PageLayout from '../components/PageLayout';

const ContactPage: React.FC = () => {
  const { label = 'records' } = useParams<{ label?: string }>();

  const labelInfo = {
    records: {
      title: 'Build It Records',
      email: 'contact@builditrecords.com',
      color: '#02FF95'
    },
    tech: {
      title: 'Build It Tech',
      email: 'contact@buildittechrecords.com',
      color: '#FF0000'
    },
    deep: {
      title: 'Build It Deep',
      email: 'contact@builditdeeprecords.com',
      color: '#00BFFF'
    }
  };

  const info = labelInfo[label as keyof typeof labelInfo];

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // Handle form submission
  };

  return (
    <PageLayout label={label as 'records' | 'tech' | 'deep'}>
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper 
          elevation={0}
          sx={{ 
            p: 4, 
            bgcolor: 'rgba(255, 255, 255, 0.05)',
            color: '#FFFFFF'
          }}
        >
          <Typography 
            variant="h3" 
            gutterBottom
            sx={{ 
              color: info.color,
              fontWeight: 'bold',
              mb: 4
            }}
          >
            Contact {info.title}
          </Typography>

          <Typography variant="h6" paragraph>
            Get in touch with us for any inquiries or feedback.
          </Typography>

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 4 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Name"
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.23)',
                      },
                      '&:hover fieldset': {
                        borderColor: info.color,
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: 'rgba(255, 255, 255, 0.7)',
                    },
                    '& .MuiInputBase-input': {
                      color: '#FFFFFF',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.23)',
                      },
                      '&:hover fieldset': {
                        borderColor: info.color,
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: 'rgba(255, 255, 255, 0.7)',
                    },
                    '& .MuiInputBase-input': {
                      color: '#FFFFFF',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Subject"
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.23)',
                      },
                      '&:hover fieldset': {
                        borderColor: info.color,
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: 'rgba(255, 255, 255, 0.7)',
                    },
                    '& .MuiInputBase-input': {
                      color: '#FFFFFF',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Message"
                  multiline
                  rows={4}
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.23)',
                      },
                      '&:hover fieldset': {
                        borderColor: info.color,
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: 'rgba(255, 255, 255, 0.7)',
                    },
                    '& .MuiInputBase-input': {
                      color: '#FFFFFF',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  sx={{
                    bgcolor: info.color,
                    color: '#121212',
                    '&:hover': {
                      bgcolor: info.color,
                      opacity: 0.9,
                    },
                  }}
                >
                  Send Message
                </Button>
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ mt: 6 }}>
            <Typography variant="h6" gutterBottom sx={{ color: info.color }}>
              Direct Contact
            </Typography>
            <Typography>
              Email: {info.email}
            </Typography>
          </Box>
        </Paper>
      </Container>
    </PageLayout>
  );
};

export default ContactPage;
