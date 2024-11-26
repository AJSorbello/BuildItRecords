import React from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  RefreshControl,
  ScrollView,
} from 'react-native';
import ReleaseCard from './ReleaseCard';
import FeaturedRelease from './FeaturedRelease';
import { useReleases } from '../hooks/useReleases';
import { SpotifyRelease } from '../services/SpotifyService';

interface ReleasesGridProps {
  label: 'records' | 'tech' | 'deep';
}

const ReleasesGrid: React.FC<ReleasesGridProps> = ({ label }) => {
  const { releases, isLoading, error, refetch } = useReleases(label);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1DB954" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!releases.length) {
    return null;
  }

  const formatRelease = (release: SpotifyRelease) => ({
    id: release.id,
    title: release.name,
    artist: release.artists.map(artist => artist.name).join(', '),
    artwork: release.images[0]?.url || 'https://via.placeholder.com/300',
    releaseDate: release.release_date,
    spotifyLink: release.external_urls.spotify,
    tracks: release.tracks.items.map(track => ({
      id: track.id,
      title: track.name,
      artist: track.artists.map(artist => artist.name).join(', '),
      duration: `${Math.floor(track.duration_ms / 60000)}:${(
        ((track.duration_ms % 60000) / 1000)
      ).toFixed(0).padStart(2, '0')}`,
      spotifyId: track.id,
      previewUrl: track.preview_url,
    })),
    label,
  });

  const latestRelease = formatRelease(releases[0]);
  const pastReleases = releases.slice(1).map(formatRelease);

  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={refetch}
          tintColor="#1DB954"
        />
      }
    >
      <View style={styles.container}>
        <FeaturedRelease release={latestRelease} />
        <View style={styles.pastReleases}>
          {pastReleases.map((release) => (
            <ReleaseCard
              key={`${release.artist}-${release.title}`}
              release={release}
              compact
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    padding: 10,
  },
  pastReleases: {
    marginTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ff4444',
    textAlign: 'center',
    fontSize: 16,
  },
});

export default ReleasesGrid;
