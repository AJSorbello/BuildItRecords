import { useState, useEffect, useCallback } from 'react';
import { Release, PaginatedResponse } from 'types';
import { DatabaseApiError } from 'utils/errors';
import { databaseService } from '../services/DatabaseService';

interface UseReleasesResult {
  releases: Release[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useReleases(label?: string): UseReleasesResult {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReleases = useCallback(async () => {
    if (!label) {
      setReleases([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await databaseService.getReleases(label);
      setReleases(response.items);
      setError(null);
    } catch (err) {
      if (err instanceof DatabaseApiError) {
        setError(err.message);
      } else {
        setError('Failed to fetch releases');
      }
      setReleases([]);
    } finally {
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
    refetch: fetchReleases
  };
}
