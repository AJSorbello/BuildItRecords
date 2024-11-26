import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useReleases } from '../../hooks/useReleases';
import { useSpotifyFollow } from '../../hooks/useSpotifyFollow';
import ReleasesGrid from '../../components/ReleasesGrid';

// Mock releases for Build It Deep
const mockReleases = [
  {
    id: 'deep1',
    title: 'Midnight Waters EP',
    artist: 'Deep Diver',
    artwork: 'https://via.placeholder.com/300',
    releaseDate: '2024-02-05',
    genre: 'Deep House',
    beatportLink: 'https://www.beatport.com/release/deep-sample/1',
    spotifyLink: 'https://open.spotify.com/album/deep1',
    soundcloudLink: 'https://soundcloud.com/deepdiver/midnight-waters',
    tracks: [
      {
        id: 'deep_t1',
        title: 'Midnight Waters (Original Mix)',
        artist: 'Deep Diver',
        duration: '6:30',
        spotifyId: 'spotify:track:deep1_1',
      },
      {
        id: 'deep_t2',
        title: 'Ocean Floor (Original Mix)',
        artist: 'Deep Diver',
        duration: '7:15',
        spotifyId: 'spotify:track:deep1_2',
      },
    ],
    label: 'deep',
  },
  {
    id: 'deep2',
    title: 'Soulful Journey',
    artist: 'Melodic Mind',
    artwork: 'https://via.placeholder.com/300',
    releaseDate: '2024-01-25',
    genre: 'Melodic House',
    beatportLink: 'https://www.beatport.com/release/deep-sample/2',
    spotifyLink: 'https://open.spotify.com/album/deep2',
    tracks: [
      {
        id: 'deep_t3',
        title: 'Soulful Journey (Original Mix)',
        artist: 'Melodic Mind',
        duration: '7:45',
        spotifyId: 'spotify:track:deep2_1',
      },
      {
        id: 'deep_t4',
        title: 'Inner Peace (Original Mix)',
        artist: 'Melodic Mind',
        duration: '8:00',
        spotifyId: 'spotify:track:deep2_2',
      },
    ],
    label: 'deep',
  },
  {
    id: 'deep3',
    title: 'Ethereal Depths',
    artist: 'Harmony Wave',
    artwork: 'https://via.placeholder.com/300',
    releaseDate: '2024-01-15',
    genre: 'Progressive House',
    beatportLink: 'https://www.beatport.com/release/deep-sample/3',
    spotifyLink: 'https://open.spotify.com/album/deep3',
    tracks: [
      {
        id: 'deep_t5',
        title: 'Ethereal Depths (Original Mix)',
        artist: 'Harmony Wave',
        duration: '8:30',
        spotifyId: 'spotify:track:deep3_1',
      },
      {
        id: 'deep_t6',
        title: 'Celestial Dance (Original Mix)',
        artist: 'Harmony Wave',
        duration: '7:30',
        spotifyId: 'spotify:track:deep3_2',
      },
    ],
    label: 'deep',
  },
];

export const HomeScreen = () => {
  const { colors } = useTheme();
  const { releases, loading, error } = useReleases('builditdeep');
  const { isFollowing, handleFollow } = useSpotifyFollow('builditdeep');

  const handleSpotifyPress = async () => {
    const url = 'https://open.spotify.com/user/builditdeep';
    if (await Linking.canOpenURL(url)) {
      await Linking.openURL(url);
      handleFollow();
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.hero, { backgroundColor: colors.background }]}>
        <Image
          source={require('../../assets/png/deep/BuildIt_Deep.png')}
          style={[styles.logo, { tintColor: '#FFFFFF' }]}
        />
        <Text style={[styles.title, { color: colors.text }]}>BUILD IT DEEP</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Deep house, melodic house, and progressive
        </Text>
      </View>

      {!isFollowing && (
        <TouchableOpacity 
          style={[styles.spotifyButton, { backgroundColor: colors.primary }]}
          onPress={handleSpotifyPress}
        >
          <Text style={styles.spotifyButtonText}>Follow on Spotify</Text>
        </TouchableOpacity>
      )}

      <View style={styles.content}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Latest Releases</Text>
        <ReleasesGrid releases={releases} loading={loading} error={error} label="deep" />
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  logo: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
    marginVertical: 20,
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
