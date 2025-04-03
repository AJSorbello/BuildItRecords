import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Paper,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
  Snackbar,
  Alert,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel
} from '@mui/material';
import { styled } from '@mui/system';
import { labelColors } from '../theme/theme';
import { databaseService } from '../services/DatabaseService';

// Styled components for enhanced visual design
const GlowingCard = styled(Card)(({ theme }) => ({
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  boxShadow: '0 8px 32px rgba(2, 255, 149, 0.1)',
  transition: 'all 0.3s ease-in-out',
  overflow: 'hidden',
  position: 'relative',
  '&:hover': {
    boxShadow: '0 8px 32px rgba(2, 255, 149, 0.2)',
    transform: 'translateY(-5px)',
    '&::before': {
      opacity: 0.7,
    }
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '5px',
    background: `linear-gradient(90deg, ${labelColors.deep}, ${labelColors.tech}, ${labelColors.records})`,
    opacity: 0.5,
    transition: 'opacity 0.3s ease-in-out',
  }
}));

const PricingFeature = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(1),
  '&::before': {
    content: '"✓"',
    marginRight: theme.spacing(1),
    color: labelColors.records,
    fontWeight: 'bold',
  }
}));

const HighlightText = styled('span')({
  color: labelColors.records,
  fontWeight: 'bold',
});

// VIP Subscription Component
const VIPSubscription: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [plan, setPlan] = useState('monthly');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSubscribe = async () => {
    if (!email || !name) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use the database service to process subscription
      await databaseService.subscribeToVIP({
        name,
        email,
        plan
      });
      
      setSuccess(true);
      setOpen(false);
      setEmail('');
      setName('');
      setPlan('monthly');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error processing subscription. Please try again.');
      console.error('Subscription error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const plans = [
    {
      id: 'monthly',
      title: 'Monthly VIP',
      price: '$9.99',
      period: 'month',
      features: [
        'Early access to new releases',
        'Exclusive remixes & edits',
        'Monthly sample pack',
        'Discounts on merchandise'
      ],
      color: labelColors.records,
      popular: false
    },
    {
      id: 'annual',
      title: 'Annual VIP',
      price: '$99.99',
      period: 'year',
      features: [
        'All Monthly VIP benefits',
        'Two free merchandise items',
        'Virtual studio sessions',
        'Voting rights on upcoming releases',
        'VIP Discord access'
      ],
      color: labelColors.deep,
      popular: true
    },
    {
      id: 'premium',
      title: 'Premium VIP',
      price: '$199.99',
      period: 'year',
      features: [
        'All Annual VIP benefits',
        'Quarterly 1-on-1 feedback on your music',
        'Label consideration priority',
        'Exclusive event invites',
        'VIP merchandise package'
      ],
      color: labelColors.tech,
      popular: false
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h2" component="h1" gutterBottom sx={{ 
          fontWeight: 800,
          background: `linear-gradient(45deg, ${labelColors.records}, ${labelColors.deep})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 0 20px rgba(2, 255, 149, 0.3)'
        }}>
          Build It VIP Access
        </Typography>
        <Typography variant="h5" color="text.secondary" sx={{ 
          mb: 3,
          maxWidth: '800px',
          mx: 'auto'
        }}>
          Get exclusive access to unreleased tracks, special remixes, and premium content from our artists
        </Typography>
      </Box>

      <Grid container spacing={isMobile ? 4 : 3} justifyContent="center">
        {plans.map((plan) => (
          <Grid item xs={12} sm={6} md={4} key={plan.id}>
            <GlowingCard sx={{ 
              height: '100%',
              position: 'relative',
              ...(plan.popular && {
                transform: 'scale(1.05)',
                zIndex: 1,
                border: `1px solid ${plan.color}`,
                boxShadow: `0 8px 32px ${plan.color}30`,
                [`@media (max-width:600px)`]: {
                  transform: 'scale(1)',
                }
              })
            }}>
              {plan.popular && (
                <Box sx={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  backgroundColor: plan.color,
                  color: 'black',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  transform: 'rotate(5deg)',
                  zIndex: 10
                }}>
                  MOST POPULAR
                </Box>
              )}
              <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h4" component="h2" gutterBottom sx={{ 
                  fontWeight: 700,
                  color: plan.color,
                  textAlign: 'center',
                  mb: 3
                }}>
                  {plan.title}
                </Typography>
                
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Typography variant="h3" component="p" sx={{ fontWeight: 700 }}>
                    {plan.price}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    per {plan.period}
                  </Typography>
                </Box>

                <Box sx={{ mb: 3, flexGrow: 1 }}>
                  {plan.features.map((feature, index) => (
                    <PricingFeature key={index}>
                      <Typography variant="body2">{feature}</Typography>
                    </PricingFeature>
                  ))}
                </Box>

                <Button 
                  variant="contained" 
                  fullWidth
                  onClick={handleClickOpen}
                  sx={{ 
                    backgroundColor: plan.color,
                    color: '#000',
                    py: 1.5,
                    '&:hover': {
                      backgroundColor: plan.color,
                      filter: 'brightness(1.1)',
                    }
                  }}
                >
                  Subscribe Now
                </Button>
              </CardContent>
            </GlowingCard>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          What Our <HighlightText>VIP Members</HighlightText> Say
        </Typography>
        
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
              <Typography variant="body1" paragraph>
                "The exclusive tracks and early access have completely changed how I discover new music. Worth every penny!"
              </Typography>
              <Typography variant="subtitle2" color={labelColors.records}>- DJ Maximus</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
              <Typography variant="body1" paragraph>
                "Being part of the VIP community has connected me with other passionate house music fans. The exclusive content is just a bonus!"
              </Typography>
              <Typography variant="subtitle2" color={labelColors.deep}>- Sarah K.</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
              <Typography variant="body1" paragraph>
                "The feedback I received on my tracks from the label artists was invaluable. This subscription is a must for any aspiring producer."
              </Typography>
              <Typography variant="subtitle2" color={labelColors.tech}>- Producer XYZ</Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Subscription Dialog */}
      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          style: {
            backgroundColor: '#121212',
            backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.03))',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
            Join Build It VIP
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Get exclusive access to premium content
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <TextField
            autoFocus
            margin="dense"
            label="Full Name"
            type="text"
            fullWidth
            variant="outlined"
            value={name}
            onChange={(e) => setName(e.target.value)}
            sx={{ mb: 3 }}
          />
          
          <TextField
            margin="dense"
            label="Email Address"
            type="email"
            fullWidth
            variant="outlined"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ mb: 3 }}
          />

          <FormControl component="fieldset" sx={{ mb: 2 }}>
            <FormLabel component="legend" sx={{ color: 'text.secondary' }}>
              Choose your plan
            </FormLabel>
            <RadioGroup 
              value={plan} 
              onChange={(e) => setPlan(e.target.value)}
            >
              <FormControlLabel value="monthly" control={<Radio />} label="Monthly VIP ($9.99/month)" />
              <FormControlLabel value="annual" control={<Radio />} label="Annual VIP ($99.99/year) — Save 17%" />
              <FormControlLabel value="premium" control={<Radio />} label="Premium VIP ($199.99/year)" />
            </RadioGroup>
          </FormControl>
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            By subscribing, you agree to our Terms of Service and Privacy Policy. You can cancel your subscription at any time.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleClose} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleSubscribe} 
            variant="contained"
            disabled={loading}
            sx={{ 
              backgroundColor: labelColors.records,
              color: '#000',
              '&:hover': {
                backgroundColor: labelColors.records,
                filter: 'brightness(1.1)',
              }
            }}
          >
            {loading ? 'Processing...' : 'Subscribe Now'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Notification */}
      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled">
          Successfully subscribed to Build It VIP! Check your email for details.
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default VIPSubscription;
