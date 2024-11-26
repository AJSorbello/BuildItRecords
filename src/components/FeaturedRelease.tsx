import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { Release } from '../types/Release';

interface FeaturedReleaseProps {
  release: Release;
}

export default function FeaturedRelease({ release }: FeaturedReleaseProps) {
  const { colors } = useTheme();

  const openLink = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>Latest Release</Text>
      <View style={styles.content}>
        <Image source={{ uri: release.artwork }} style={styles.artwork} />
        <View style={styles.info}>
          <Text style={[styles.artist, { color: colors.text }]}>{release.artist}</Text>
          <Text style={[styles.title, { color: colors.text }]}>{release.title}</Text>
          <Text style={[styles.date, { color: colors.textSecondary }]}>
            {new Date(release.releaseDate).toLocaleDateString()}
          </Text>
          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#1DB954' }]}
              onPress={() => openLink(release.spotifyUrl)}
            >
              <Ionicons name="logo-spotify" size={20} color="#FFFFFF" />
              <Text style={styles.buttonText}>Spotify</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#FF6B00' }]}
              onPress={() => openLink(release.beatportUrl)}
            >
              <Text style={styles.buttonText}>Beatport</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#FF5500' }]}
              onPress={() => openLink(release.soundcloudUrl)}
            >
              <Ionicons name="logo-soundcloud" size={20} color="#FFFFFF" />
              <Text style={styles.buttonText}>SoundCloud</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    marginVertical: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  artwork: {
    width: 300,
    height: 300,
    borderRadius: 10,
    marginBottom: 20,
  },
  info: {
    alignItems: 'center',
  },
  artist: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  title: {
    fontSize: 18,
    marginBottom: 5,
  },
  date: {
    fontSize: 14,
    marginBottom: 20,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
