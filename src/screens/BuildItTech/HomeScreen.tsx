import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Image } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useReleases } from '../../hooks/useReleases';
import ReleasesGrid from '../../components/ReleasesGrid';
import { TechSidebar } from '../../components/TechSidebar';

export const HomeScreen = () => {
  const { colors } = useTheme();
  const { releases, loading, error } = useReleases('buildittechrecords');

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' ? (
        <TechSidebar />
      ) : null}
      <ScrollView style={[styles.mainContent, { backgroundColor: colors.background }]}>
        <View style={[styles.hero, { backgroundColor: colors.background }]}>
          <Image
            source={require('../../assets/png/tech/BuildIt_Tech_Square.png')}
            style={[styles.logo, { tintColor: '#FFFFFF' }]}
          />
          <Text style={[styles.title, { color: colors.text }]}>Build It Tech</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            The Home of Techno Music
          </Text>
        </View>

        <View style={styles.content}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Latest Releases</Text>
          <ReleasesGrid releases={releases.slice(0, 1)} loading={loading} error={error} />
        </View>

        <View style={styles.content}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Past Releases</Text>
          <ReleasesGrid releases={releases.slice(1)} loading={loading} error={error} />
        </View>
      </ScrollView>
      {Platform.OS !== 'web' ? (
        <TechSidebar />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#121212',
  },
  mainContent: {
    flex: 1,
  },
  hero: {
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});
