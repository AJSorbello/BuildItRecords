import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useReleases } from '../../hooks/useReleases';
import { useSpotifyFollow } from '../../hooks/useSpotifyFollow';
import ReleasesGrid from '../../components/ReleasesGrid';

export const HomeScreen = () => {
  const { colors } = useTheme();
  const { releases, loading, error } = useReleases('builditrecords');
  const { isFollowing, handleFollow } = useSpotifyFollow('builditrecords');

  const handleSpotifyPress = async () => {
    const url = 'https://open.spotify.com/user/builditrecords';
    if (await Linking.canOpenURL(url)) {
      await Linking.openURL(url);
      handleFollow();
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.hero, { backgroundColor: colors.background }]}>
        <Image
          source={require('../../assets/png/records/BuildItRecords.png')}
          style={[styles.logo, { tintColor: '#FFFFFF' }]}
        />
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          House, techno, and electronic music
        </Text>
      </View>

      {!isFollowing && (
        <TouchableOpacity 
          style={[styles.spotifyButton, { backgroundColor: colors.primary }]}
          onPress={handleSpotifyPress}
        >
          <Ionicons name="logo-spotify" size={24} color="#FFFFFF" />
          <Text style={styles.spotifyButtonText}>Follow on Spotify</Text>
        </TouchableOpacity>
      )}

      <View style={styles.content}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Latest Releases</Text>
        <ReleasesGrid releases={releases} loading={loading} error={error} label="records" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  hero: {
    padding: 40,
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
    marginVertical: 20,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  spotifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    marginVertical: 20,
    gap: 8,
  },
  spotifyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});
