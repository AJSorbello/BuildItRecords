import React from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`legal-tabpanel-${index}`}
      aria-labelledby={`legal-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `legal-tab-${index}`,
    'aria-controls': `legal-tabpanel-${index}`,
  };
}

const LegalPage: React.FC = () => {
  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        color: 'white',
        p: 2 
      }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
          Legal Information
        </Typography>

        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="legal information tabs"
          centered
          sx={{
            '& .MuiTab-root': {
              color: 'rgba(255, 255, 255, 0.7)',
              '&.Mui-selected': {
                color: '#02FF95',
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#02FF95',
            },
          }}
        >
          <Tab label="Terms of Service" {...a11yProps(0)} />
          <Tab label="Privacy Policy" {...a11yProps(1)} />
        </Tabs>

        <TabPanel value={value} index={0}>
          <Typography variant="h5" gutterBottom sx={{ color: '#02FF95' }}>
            Terms of Service
          </Typography>
          
          <List>
            <ListItem>
              <ListItemText
                primary="1. Acceptance of Terms"
                secondary={
                  <Typography color="text.secondary">
                    By submitting music to Build It Records, you agree to be bound by these terms and conditions.
                  </Typography>
                }
              />
            </ListItem>
            
            <Divider sx={{ my: 2, backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
            
            <ListItem>
              <ListItemText
                primary="2. Submission Guidelines"
                secondary={
                  <Box component="div" sx={{ color: 'text.secondary' }}>
                    <Typography paragraph>All submissions must:</Typography>
                    <List>
                      <ListItem>
                        <ListItemText primary="• Be 100% original and royalty-free" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="• Be previously unreleased material" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="• Be submitted in WAV format without limiting on the master bus" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="• Include only cleared samples (if any)" />
                      </ListItem>
                    </List>
                  </Box>
                }
              />
            </ListItem>
            
            <Divider sx={{ my: 2, backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
            
            <ListItem>
              <ListItemText
                primary="3. Rights and Ownership"
                secondary={
                  <Typography color="text.secondary">
                    You retain the copyright to your music. By submitting, you grant Build It Records the right to review and potentially offer a contract for release. No rights are transferred until a separate agreement is signed.
                  </Typography>
                }
              />
            </ListItem>
            
            <Divider sx={{ my: 2, backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
            
            <ListItem>
              <ListItemText
                primary="4. Revenue Sharing"
                secondary={
                  <Typography color="text.secondary">
                    If your track is selected for release, royalties will be split 50/50 between the artist and label, as specified in the subsequent release agreement.
                  </Typography>
                }
              />
            </ListItem>
            
            <Divider sx={{ my: 2, backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
            
            <ListItem>
              <ListItemText
                primary="5. Response Time"
                secondary={
                  <Typography color="text.secondary">
                    We aim to respond to all submissions within 7 business days. Due to high volume, we cannot guarantee feedback on rejected submissions.
                  </Typography>
                }
              />
            </ListItem>
          </List>
        </TabPanel>

        <TabPanel value={value} index={1}>
          <Typography variant="h5" gutterBottom sx={{ color: '#02FF95' }}>
            Privacy Policy
          </Typography>
          
          <List>
            <ListItem>
              <ListItemText
                primary="1. Information We Collect"
                secondary={
                  <Box component="div" sx={{ color: 'text.secondary' }}>
                    <Typography paragraph>We collect the following information:</Typography>
                    <List>
                      <ListItem>
                        <ListItemText primary="• Full name and artist name" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="• Email address" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="• Country and province/state" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="• Social media links" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="• Music submissions and related metadata" />
                      </ListItem>
                    </List>
                  </Box>
                }
              />
            </ListItem>
            
            <Divider sx={{ my: 2, backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
            
            <ListItem>
              <ListItemText
                primary="2. How We Use Your Information"
                secondary={
                  <Box component="div" sx={{ color: 'text.secondary' }}>
                    <Typography paragraph>Your information is used for:</Typography>
                    <List>
                      <ListItem>
                        <ListItemText primary="• Reviewing and processing submissions" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="• Communication regarding your submission" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="• Contract preparation if selected" />
                      </ListItem>
                    </List>
                  </Box>
                }
              />
            </ListItem>
            
            <Divider sx={{ my: 2, backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
            
            <ListItem>
              <ListItemText
                primary="3. Data Protection"
                secondary={
                  <Typography color="text.secondary">
                    We implement appropriate security measures to protect your personal information. Your data is stored securely and is only accessible to authorized personnel.
                  </Typography>
                }
              />
            </ListItem>
            
            <Divider sx={{ my: 2, backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
            
            <ListItem>
              <ListItemText
                primary="4. Your Rights"
                secondary={
                  <Box component="div" sx={{ color: 'text.secondary' }}>
                    <Typography paragraph>You have the right to:</Typography>
                    <List>
                      <ListItem>
                        <ListItemText primary="• Access your personal data" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="• Request data correction" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="• Request data deletion" />
                      </ListItem>
                    </List>
                  </Box>
                }
              />
            </ListItem>
            
            <Divider sx={{ my: 2, backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
            
            <ListItem>
              <ListItemText
                primary="5. Contact Us"
                secondary={
                  <Typography color="text.secondary">
                    For any privacy-related concerns or requests, please contact us at aj@builditrecords.com
                  </Typography>
                }
              />
            </ListItem>
          </List>
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default LegalPage;
