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

  // Required properties and their types
  const requiredProps = {
    id: 'string',
    title: 'string',
    type: ['album', 'single', 'compilation'],
    release_date: 'string',
    uri: 'string',
    total_tracks: 'number'
  };

  // Check all required properties
  for (const [prop, expectedType] of Object.entries(requiredProps)) {
    if (!(prop in release)) {
      console.error(`Release missing required property: ${prop}`, release);
      return false;
    }

    if (Array.isArray(expectedType)) {
      if (!expectedType.includes(release[prop])) {
        console.error(`Invalid value for ${prop}:`, release[prop], 'expected one of:', expectedType);
        return false;
      }
    } else if (typeof release[prop] !== expectedType) {
      console.error(`Invalid type for ${prop}:`, typeof release[prop], 'expected:', expectedType);
      return false;
    }
  }

  // Initialize array properties
  release.artists = Array.isArray(release.artists) ? release.artists : [];
  release.tracks = Array.isArray(release.tracks) ? release.tracks : [];
  release.images = Array.isArray(release.images) ? release.images : [];

  // Initialize object properties
  release.external_urls = release.external_urls || {};

  // Handle optional properties with undefined (not null)
  release.artwork_url = release.artwork_url || release.images?.[0]?.url || undefined;
  release.release_date_precision = release.release_date_precision || 'day';
  release.spotifyUrl = release.spotifyUrl || release.spotify_url || release.external_urls?.spotify;
  release.spotify_uri = release.spotify_uri || release.uri;
  release.status = release.status || 'active';

  return true;
};

export function useReleases(label?: string): UseReleasesResult {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalReleases, setTotalReleases] = useState(0);
  const [totalTracks, setTotalTracks] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchReleases = useCallback(async (page: number = 1, isLoadingMore: boolean = false) => {
    if (!label) {
      setReleases([]);
      setLoading(false);
      return;
    }

    try {
      if (!isLoadingMore) {
        setLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      setError(null);

      console.log('Fetching releases for label:', label, 'page:', page);
      const data = await databaseService.getReleasesByLabelId(label, page);
      console.log('Raw API response:', data);
      console.log('API Response data:', data); // Added logging

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
          artwork_url: release.artwork_url || release.images?.[0]?.url || undefined
        }));

      console.log('Processed releases:', {
        total: validReleases.length,
        totalFromAPI: data.totalReleases,
        totalTracksFromAPI: data.totalTracks,
        filtered: data.releases.length - validReleases.length,
        hasMore: data.hasMore
      });

      setReleases(prev => isLoadingMore ? [...prev, ...validReleases] : validReleases);
      setTotalReleases(data.totalReleases);
      setTotalTracks(data.totalTracks);
      setHasMore(data.hasMore);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching releases:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch releases');
    } finally {
      if (!isLoadingMore) {
        setLoading(false);
      } else {
        setIsLoadingMore(false);
      }
    }
  }, [label]);

  const loadMore = useCallback(async () => {
    if (!loading && !isLoadingMore && hasMore) {
      await fetchReleases(currentPage + 1, true);
    }
  }, [loading, isLoadingMore, hasMore, currentPage, fetchReleases]);

  const refetch = useCallback(() => fetchReleases(1), [fetchReleases]);

  useEffect(() => {
    fetchReleases(1);
  }, [label, fetchReleases]);

  return {
    releases,
    loading: loading || isLoadingMore,
    error,
    refetch,
    totalReleases,
    totalTracks,
    currentPage,
    totalPages: Math.ceil(totalReleases / 50),
    hasMore,
    loadMore
  };
}
