import { useState, useEffect } from 'react';
import SpotifyService, { SpotifyRelease } from '../services/SpotifyService';

const SPOTIFY_IDS = {
  records: 'builditrecords',
  tech: 'buildittech',
  deep: 'builditdeep',
};

const BEATPORT_URLS = {
  records: 'https://www.beatport.com/label/build-it-records/89999',
  tech: 'https://www.beatport.com/label/build-it-tech/89998',
  deep: 'https://www.beatport.com/label/build-it-deep/89997',
};

const SOUNDCLOUD_URLS = {
  records: 'https://soundcloud.com/builditrecords',
  tech: 'https://soundcloud.com/buildittech',
  deep: 'https://soundcloud.com/builditdeep',
};

export const useReleases = (labelId: string) => {
  const [releases, setReleases] = useState<SpotifyRelease[]>([]);
  const [latestRelease, setLatestRelease] = useState<SpotifyRelease | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReleases = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const spotifyService = SpotifyService.getInstance();
        const allReleases = await spotifyService.getLabelReleases(labelId);
        
        const formattedReleases = allReleases.map(release => ({
          ...release,
          beatportUrl: BEATPORT_URLS[labelId],
          soundcloudUrl: SOUNDCLOUD_URLS[labelId],
        }));

        setReleases(formattedReleases);
        setLatestRelease(formattedReleases.length > 0 ? formattedReleases[0] : null);
      } catch (err) {
        console.error('Error fetching releases:', err);
        setError('Failed to load releases. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReleases();
  }, [labelId]);

  return {
    releases,
    latestRelease,
    isLoading,
    error,
    refetch: () => {
      setIsLoading(true);
      setError(null);
      fetchReleases();
    },
  };
};
