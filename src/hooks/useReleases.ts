import { useState, useEffect, useCallback } from 'react';
import { Release } from '../types/release';
import { databaseService } from '../services/DatabaseService';

interface UseReleasesResult {
  releases: Release[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  totalReleases: number;
  totalTracks: number;
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
  loadMore: () => Promise<void>;
}

const validateRelease = (release: any): release is Release => {
  if (!release || typeof release !== 'object') {
    console.error('Invalid release object:', release);
    return false;
  }

  // Ensure required properties exist
  const hasRequiredProps = 
    'id' in release && 
    'name' in release && 
    typeof release.id === 'string' && 
    typeof release.name === 'string';

  if (!hasRequiredProps) {
    console.error('Release missing required properties:', release);
    return false;
  }

  // Initialize optional properties with default values
  release.artists = Array.isArray(release.artists) ? release.artists : [];
  release.tracks = Array.isArray(release.tracks) ? release.tracks : [];
  release.images = Array.isArray(release.images) ? release.images : [];
  release.external_urls = release.external_urls || {};
  release.artwork_url = release.artwork_url || release.images?.[0]?.url || null;

  return true;
};

export function useReleases(label?: string): UseReleasesResult {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalReleases, setTotalReleases] = useState(0);
  const [totalTracks, setTotalTracks] = useState(0);

  const fetchReleases = useCallback(async () => {
    if (!label) {
      setReleases([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      setLoading(true);

      console.log('Fetching releases for label:', label);
      const data = await databaseService.getReleasesByLabelId(label);
      console.log('Raw API response:', data);

      if (!data) {
        throw new Error('No data received from server');
      }

      // Filter and validate releases
      const validReleases = data.releases
        .filter(release => {
          const isValid = validateRelease(release);
          if (!isValid) {
            console.warn('Invalid release:', release);
          }
          return isValid;
        })
        .map(release => ({
          ...release,
          artwork_url: release.artwork_url || release.images?.[0]?.url || null
        }));

      console.log('Processed releases:', {
        total: validReleases.length,
        totalFromAPI: data.totalReleases,
        totalTracksFromAPI: data.totalTracks,
        filtered: data.releases.length - validReleases.length
      });

      setReleases(validReleases);
      setTotalReleases(data.totalReleases);
      setTotalTracks(data.totalTracks);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching releases:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch releases');
      setLoading(false);
    }
  }, [label]);

  useEffect(() => {
    fetchReleases();
  }, [fetchReleases]);

  return {
    releases,
    loading,
    error,
    refetch: fetchReleases,
    totalReleases,
    totalTracks,
    currentPage: 1,
    totalPages: 1,
    hasMore: false,
    loadMore: async () => {} // No-op since we load all releases at once
  };
}
