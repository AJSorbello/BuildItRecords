import { useState, useEffect } from 'react';
import { RecordLabel, RECORD_LABELS } from '../constants/labels';

const SPOTIFY_IDS = {
  records: 'builditrecords',
  tech: 'buildittech',
  deep: 'builditdeep',
} as const;

const BEATPORT_URLS = {
  records: 'https://www.beatport.com/label/build-it-records/89999',
  tech: 'https://www.beatport.com/label/build-it-tech/90000',
  deep: 'https://www.beatport.com/label/build-it-deep/90001',
} as const;

const SOUNDCLOUD_URLS = {
  records: 'https://soundcloud.com/builditrecords',
  tech: 'https://soundcloud.com/buildittech',
  deep: 'https://soundcloud.com/builditdeep',
} as const;

export type LabelId = keyof typeof SPOTIFY_IDS;

interface Release {
  id: string;
  title: string;
  artist: {
    name: string;
  };
  imageUrl: string;
  releaseDate: string;
}

const labelIdToRecordLabel = (labelId: LabelId): RecordLabel => {
  switch (labelId) {
    case 'records':
      return RECORD_LABELS['Build It Records'];
    case 'tech':
      return RECORD_LABELS['Build It Tech'];
    case 'deep':
      return RECORD_LABELS['Build It Deep'];
  }
};

export const useReleases = (labelId: LabelId) => {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReleases = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/${labelId}/releases`);
      if (!response.ok) {
        throw new Error('Failed to fetch releases');
      }
      const data = await response.json();
      setReleases(data);
    } catch (err) {
      console.error('Error fetching releases:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch releases');
    } finally {
      setLoading(false);
    }
  };

  const refreshReleases = () => {
    fetchReleases();
  };

  useEffect(() => {
    fetchReleases();
  }, [labelId]);

  return {
    releases,
    loading,
    error,
    refreshReleases,
    spotifyUrl: `https://open.spotify.com/user/${SPOTIFY_IDS[labelId]}`,
    beatportUrl: BEATPORT_URLS[labelId],
    soundcloudUrl: SOUNDCLOUD_URLS[labelId],
  };
};

export default useReleases;
