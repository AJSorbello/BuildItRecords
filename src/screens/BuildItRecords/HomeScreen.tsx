import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import ReleasesGrid from '../../components/ReleasesGrid';

export default function BuildItRecordsHome() {
  const { colors } = useTheme();

  const openSpotify = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.hero, { backgroundColor: colors.background }]}>
        <Image
          source={require('../../assets/png/records/BuildItRecords.png')}
          style={styles.logo}
        />
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          House, techno, and electronic music
        </Text>
      </View>

      <TouchableOpacity 
        style={[styles.spotifyButton, { backgroundColor: colors.primary }]}
        onPress={() => openSpotify('https://open.spotify.com/user/builditrecords')}
      >
        <Ionicons name="logo-spotify" size={24} color="#FFFFFF" />
        <Text style={styles.spotifyButtonText}>Follow on Spotify</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Latest Releases</Text>
        <ReleasesGrid label="records" />
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
    width: '80%',
    height: 80,
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
    justifyContent: 'center',
    marginHorizontal: 20,
    padding: 15,
    borderRadius: 25,
  },
  spotifyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
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
