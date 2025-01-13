import { useState, useEffect, useCallback } from 'react';
import type { Release } from '../types/release';
import { RECORD_LABELS } from '../constants/labels';
import { databaseService, ApiError } from '../services/DatabaseService';
import { Track } from '../types/track';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

interface CacheItem {
  data: Release[];
  timestamp: number;
}

const releaseCache = new Map<string, CacheItem>();

export interface UseReleasesProps {
  label: string;
}

export const useReleases = ({ label }: UseReleasesProps) => {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const getCachedReleases = (labelId: string): Release[] | null => {
    const cached = releaseCache.get(labelId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    return null;
  };

  const setCachedReleases = (labelId: string, data: Release[]) => {
    releaseCache.set(labelId, {
      data,
      timestamp: Date.now(),
    });
  };

  const fetchReleasesWithRetry = useCallback(async (
    labelId: string,
    attempt: number = 0
  ): Promise<Release[]> => {
    try {
      const releases = await databaseService.getReleasesByLabelId(labelId);
      setCachedReleases(labelId, releases);
      return releases;
    } catch (err) {
      if (attempt < MAX_RETRIES) {
        // Exponential backoff
        const delay = RETRY_DELAY * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchReleasesWithRetry(labelId, attempt + 1);
      }
      throw err;
    }
  }, []);

  const fetchReleases = useCallback(async () => {
    if (!label) {
      setReleases([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Check cache first
      const cachedData = getCachedReleases(label);
      if (cachedData) {
        setReleases(cachedData);
        setLoading(false);
        return;
      }

      const fetchedReleases = await fetchReleasesWithRetry(label);
      setReleases(fetchedReleases);
      setError(null);
    } catch (err) {
      console.error(`Error fetching releases for label ${label}:`, err);
      if (err instanceof ApiError) {
        setError(`Failed to load releases: ${err.message}`);
      } else {
        setError(`Failed to load releases for label ${label}`);
      }
      setReleases([]);
    } finally {
      setLoading(false);
    }
  }, [label, fetchReleasesWithRetry]);

  useEffect(() => {
    fetchReleases();
  }, [fetchReleases]);

  const addReleases = useCallback((newTracks: Track[]) => {
    setReleases(prevReleases => {
      const releasesFromTracks: Release[] = newTracks.map(track => ({
        id: track.id,
        name: track.name,
        type: 'single',
        artists: track.artists,
        artwork_url: track.album?.artwork_url,
        release_date: track.releaseDate,
        total_tracks: 1,
        tracks: [track]
      }));

      const updatedReleases = [...prevReleases, ...releasesFromTracks];
      
      // Update cache with new releases
      if (label) {
        setCachedReleases(label, updatedReleases);
      }

      return updatedReleases;
    });
  }, [label]);

  const retryFetch = useCallback(() => {
    if (retryCount < MAX_RETRIES) {
      setRetryCount(prev => prev + 1);
      fetchReleases();
    }
  }, [retryCount, fetchReleases]);

  return {
    releases,
    loading,
    error,
    addReleases,
    retryFetch,
    canRetry: retryCount < MAX_RETRIES
  };
};

export default useReleases;
