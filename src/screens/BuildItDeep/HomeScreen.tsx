import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Image } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useReleases } from '../../hooks/useReleases';
import ReleasesGrid from '../../components/ReleasesGrid';
import { DeepSidebar } from '../../components/DeepSidebar';

export const HomeScreen = () => {
  const { colors } = useTheme();
  const { releases, loading, error } = useReleases('builditdeeprecords');

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' ? (
        <DeepSidebar />
      ) : null}
      <ScrollView style={[styles.mainContent, { backgroundColor: colors.background }]}>
        <View style={[styles.hero, { backgroundColor: colors.background }]}>
          <Image
            source={require('../../assets/png/deep/BuildIt_Deep_Square.png')}
            style={[styles.logo, { tintColor: '#FFFFFF' }]}
          />
          <Text style={[styles.title, { color: colors.text }]}>Build It Deep</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            The Home of Deep House Music
          </Text>
        </View>

        <View style={styles.latestRelease}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Latest Release</Text>
          {releases && releases.length > 0 && (
            <View style={[styles.featuredCard, { backgroundColor: colors.card }]}>
              <Image source={{ uri: releases[0].imageUrl }} style={styles.featuredImage} />
              <View style={styles.featuredInfo}>
                <Text style={[styles.featuredTitle, { color: colors.text }]}>{releases[0].title}</Text>
                <Text style={[styles.featuredArtist, { color: colors.textSecondary }]}>{releases[0].artist}</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.content}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Past Releases</Text>
          <ReleasesGrid releases={releases.slice(1)} loading={loading} error={error} />
        </View>
      </ScrollView>
      {Platform.OS !== 'web' ? (
        <DeepSidebar />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
  },
  mainContent: {
    flex: 1,
  },
  hero: {
    padding: 40,
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 100,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#B3B3B3',
  },
  latestRelease: {
    padding: 20,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  featuredCard: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  featuredImage: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  featuredInfo: {
    padding: 20,
  },
  featuredTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  featuredArtist: {
    fontSize: 16,
    marginBottom: 16,
  },
});
