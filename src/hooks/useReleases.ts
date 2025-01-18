import { useState, useEffect, useCallback } from 'react';
import { Release } from '../types/release';
import { databaseService } from '../services/DatabaseService';

interface UseReleasesResult {
  releases: Release[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  totalReleases: number;
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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalReleases, setTotalReleases] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const fetchReleases = useCallback(async (isLoadMore = false) => {
    if (!label) {
      setReleases([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      if (!isLoadMore) setLoading(true);

      const data = await databaseService.getReleasesByLabelId(label, currentPage);
      
      // Validate each release
      const validReleases = data.releases
        .filter(validateRelease)
        .map(release => ({
          ...release,
          artwork_url: release.artwork_url || release.images?.[0]?.url || null
        }));

      setReleases(prev => isLoadMore ? [...prev, ...validReleases] : validReleases);
      setTotalReleases(data.total || 0);
      setTotalPages(Math.ceil((data.total || 0) / 20));
      setHasMore(currentPage < Math.ceil((data.total || 0) / 20));
    } catch (err) {
      console.error('Error fetching releases:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch releases');
      setReleases([]);
    } finally {
      setLoading(false);
    }
  }, [label, currentPage]);

  const loadMore = useCallback(async () => {
    if (hasMore && !loading) {
      setCurrentPage(prev => prev + 1);
      await fetchReleases(true);
    }
  }, [hasMore, loading, fetchReleases]);

  const refetch = useCallback(async () => {
    setCurrentPage(1);
    await fetchReleases();
  }, [fetchReleases]);

  useEffect(() => {
    refetch();
  }, [label, refetch]);

  return {
    releases,
    loading,
    error,
    refetch,
    totalReleases,
    currentPage,
    totalPages,
    hasMore,
    loadMore
  };
}
