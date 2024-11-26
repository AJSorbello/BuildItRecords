import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import SpotifyService from '../services/SpotifyService';
import ReleasesGrid from '../components/ReleasesGrid';

export default function ReleasesScreen() {
  const { colors } = useTheme();
  const [releases, setReleases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReleases = async () => {
    try {
      const spotify = new SpotifyService();
      const recordsReleases = await spotify.getLabelReleases('records');
      const techReleases = await spotify.getLabelReleases('tech');
      const deepReleases = await spotify.getLabelReleases('deep');

      const allReleases = [...recordsReleases, ...techReleases, ...deepReleases]
        .sort((a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime());

      setReleases(allReleases);
      setError(null);
    } catch (err) {
      setError('Failed to load releases. Please try again later.');
      console.error('Error fetching releases:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReleases();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReleases();
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    >
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
        </View>
      ) : (
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>Latest Releases</Text>
          <ReleasesGrid releases={releases} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  errorContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
