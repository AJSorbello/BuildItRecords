import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid } from '@mui/material';
import { RECORD_LABELS } from '../../constants/labels';
import { Track } from '../../types/track';
import TrackList from '../../components/TrackList';
import PageLayout from '../../components/PageLayout';
import { spotifyService } from '../../services/SpotifyService';
import { getData } from '../../utils/dataInitializer';

const RecordsHome = () => {
  const [mainTrack, setMainTrack] = useState<Track | null>(null);
  const [otherVersions, setOtherVersions] = useState<Track[]>([]);

  useEffect(() => {
    const fetchFeaturedTracks = async () => {
      // Get tracks directly from getData like the releases page does
      const data = getData();
      const labelTracks = data.tracks.filter(track => 
        track.recordLabel.toLowerCase() === RECORD_LABELS.RECORDS.toLowerCase()
      );
      console.log('All tracks from Records label:', labelTracks);
      
      // Sort tracks by release date (newest first)
      const sortedTracks = labelTracks.sort((a, b) => {
        const dateA = new Date(a.releaseDate);
        const dateB = new Date(b.releaseDate);
        return dateB.getTime() - dateA.getTime();
      });
      console.log('Sorted tracks:', sortedTracks.map(t => ({ title: t.trackTitle, date: t.releaseDate })));

      // Get the latest release date
      const latestDate = sortedTracks[0]?.releaseDate;
      console.log('Latest release date:', latestDate);
      
      // Get all tracks from the latest release date
      const latestTracks = sortedTracks.filter(track => 
        track.releaseDate === latestDate
      );
      console.log('Tracks from latest release date:', latestTracks.map(t => t.trackTitle));

      // Group tracks by base title (removing the remix/version part)
      const getBaseTitle = (title: string) => {
        return title.split('-')[0].trim();
      };

      const baseTitle = getBaseTitle(latestTracks[0]?.trackTitle || '');
      console.log('Base title:', baseTitle);
      
      const releaseTracks = sortedTracks.filter(track => 
        getBaseTitle(track.trackTitle) === baseTitle
      );
      console.log('All versions of the release:', releaseTracks.map(t => t.trackTitle));

      if (releaseTracks.length > 0) {
        try {
          const tracksWithDetails = await Promise.all(
            releaseTracks.map(async (track) => {
              try {
                const spotifyDetails = await spotifyService.getTrackDetailsByUrl(track.spotifyUrl);
                return spotifyDetails ? {
                  ...track,
                  albumCover: spotifyDetails.albumCover,
                  previewUrl: spotifyDetails.previewUrl
                } : track;
              } catch (error) {
                console.error('Error fetching Spotify details:', error);
                return track;
              }
            })
          );
          console.log('Final tracks with details:', tracksWithDetails.map(t => t.trackTitle));
          
          // Find the radio version or use the first track
          const radioVersion = tracksWithDetails.find(t => 
            t.trackTitle.toLowerCase().includes('radio')
          ) || tracksWithDetails[0];
          
          // Filter out the radio version from other versions
          const otherTracks = tracksWithDetails.filter(t => t !== radioVersion);
          
          setMainTrack(radioVersion);
          setOtherVersions(otherTracks);
        } catch (error) {
          console.error('Error fetching Spotify details:', error);
          setMainTrack(releaseTracks[0]);
          setOtherVersions(releaseTracks.slice(1));
        }
      }
    };

    fetchFeaturedTracks();
  }, []);

  return (
    <PageLayout label="records">
      <Box sx={{ 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        maxWidth: '1200px',
        mx: 'auto',
        p: 3
      }}>
        <Typography 
          variant="h3" 
          component="h1" 
          gutterBottom 
          sx={{ 
            color: '#FFFFFF',
            mb: 2,
            fontWeight: 'bold',
            textAlign: 'center'
          }}
        >
          Build It Records
        </Typography>
        <Typography 
          variant="h5"
          sx={{ 
            color: '#AAAAAA',
            mb: 6,
            textAlign: 'center'
          }}
        >
          House Music for the Underground
        </Typography>

        <Typography 
          variant="h4" 
          gutterBottom 
          sx={{ 
            color: '#FFFFFF',
            mb: 4,
            fontWeight: 'bold'
          }}
        >
          Latest Release
        </Typography>

        {mainTrack && (
          <Box mb={4}>
            <TrackList tracks={[mainTrack]} />
          </Box>
        )}

        {/* Other Versions */}
        {otherVersions.length > 0 && (
          <Grid container spacing={3}>
            {otherVersions.map((track) => (
              <Grid item xs={12} sm={6} md={4} key={track.id}>
                <TrackList tracks={[track]} />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </PageLayout>
  );
};

export default RecordsHome;
