import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useReleases } from '../../hooks/useReleases';
import { useSpotifyFollow } from '../../hooks/useSpotifyFollow';
import ReleasesGrid from '../../components/ReleasesGrid';

// Mock releases for Build It Tech
const mockReleases = [
  {
    id: 'tech1',
    title: 'Digital Horizon EP',
    artist: 'TechMaster',
    artwork: 'https://via.placeholder.com/300',
    releaseDate: '2024-02-01',
    genre: 'Techno',
    beatportLink: 'https://www.beatport.com/release/tech-sample/1',
    spotifyLink: 'https://open.spotify.com/album/tech1',
    soundcloudLink: 'https://soundcloud.com/techmaster/digital-horizon',
    tracks: [
      {
        id: 'tech_t1',
        title: 'Digital Horizon (Original Mix)',
        artist: 'TechMaster',
        duration: '6:45',
        spotifyId: 'spotify:track:tech1_1',
      },
      {
        id: 'tech_t2',
        title: 'Neural Network (Original Mix)',
        artist: 'TechMaster',
        duration: '7:30',
        spotifyId: 'spotify:track:tech1_2',
      },
    ],
    label: 'tech',
  },
  {
    id: 'tech2',
    title: 'Quantum Drive',
    artist: 'Circuit Breaker',
    artwork: 'https://via.placeholder.com/300',
    releaseDate: '2024-01-20',
    genre: 'Hard Techno',
    beatportLink: 'https://www.beatport.com/release/tech-sample/2',
    spotifyLink: 'https://open.spotify.com/album/tech2',
    soundcloudLink: 'https://soundcloud.com/circuitbreaker/quantum-drive',
    tracks: [
      {
        id: 'tech_t3',
        title: 'Quantum Drive (Original Mix)',
        artist: 'Circuit Breaker',
        duration: '6:15',
        spotifyId: 'spotify:track:tech2_1',
      },
      {
        id: 'tech_t4',
        title: 'System Overload (Original Mix)',
        artist: 'Circuit Breaker',
        duration: '7:00',
        spotifyId: 'spotify:track:tech2_2',
      },
    ],
    label: 'tech',
  },
  {
    id: 'tech3',
    title: 'Binary Pulse',
    artist: 'Data Stream',
    artwork: 'https://via.placeholder.com/300',
    releaseDate: '2024-01-10',
    genre: 'Industrial Techno',
    beatportLink: 'https://www.beatport.com/release/tech-sample/3',
    spotifyLink: 'https://open.spotify.com/album/tech3',
    soundcloudLink: 'https://soundcloud.com/datastream/binary-pulse',
    tracks: [
      {
        id: 'tech_t5',
        title: 'Binary Pulse (Original Mix)',
        artist: 'Data Stream',
        duration: '8:00',
        spotifyId: 'spotify:track:tech3_1',
      },
      {
        id: 'tech_t6',
        title: 'Code Sequence (Original Mix)',
        artist: 'Data Stream',
        duration: '7:45',
        spotifyId: 'spotify:track:tech3_2',
      },
    ],
    label: 'tech',
  },
];

export const HomeScreen = () => {
  const { colors } = useTheme();
  const { releases, loading, error } = useReleases('buildittech');
  const { isFollowing, handleFollow } = useSpotifyFollow('buildittech');

  const handleSpotifyPress = async () => {
    const url = 'https://open.spotify.com/user/buildittech';
    if (await Linking.canOpenURL(url)) {
      await Linking.openURL(url);
      handleFollow();
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.hero, { backgroundColor: colors.background }]}>
        <Image
          source={require('../../assets/png/tech/BuildIt_Tech.png')}
          style={[styles.logo, { tintColor: '#FFFFFF' }]}
        />
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Techno, industrial, and experimental sounds
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
        <ReleasesGrid releases={releases} loading={loading} error={error} label="tech" />
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
