import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';

// Mock data for top artists
const topArtists = [
  {
    id: '1',
    name: 'Artist 1',
    imageUrl: 'https://via.placeholder.com/150',
    monthlyListeners: 50000,
  },
  // Add more mock artists...
];

// Mock data for all artists
const allArtists = [
  {
    id: '1',
    name: 'Artist 1',
    imageUrl: 'https://via.placeholder.com/150',
    labels: ['records'],
  },
  // Add more mock artists...
];

export const ArtistsScreen = () => {
  const { colors } = useTheme();

  const renderTopArtist = ({ item }) => (
    <TouchableOpacity style={styles.topArtistCard}>
      <Image source={{ uri: item.imageUrl }} style={styles.topArtistImage} />
      <Text style={[styles.topArtistName, { color: colors.text }]}>{item.name}</Text>
      <Text style={[styles.listenerCount, { color: colors.textSecondary }]}>
        {item.monthlyListeners.toLocaleString()} monthly listeners
      </Text>
    </TouchableOpacity>
  );

  const renderArtist = ({ item }) => (
    <TouchableOpacity style={[styles.artistCard, { backgroundColor: colors.card }]}>
      <Image source={{ uri: item.imageUrl }} style={styles.artistImage} />
      <Text style={[styles.artistName, { color: colors.text }]}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Artists</Text>
      <FlatList
        horizontal
        data={topArtists}
        renderItem={renderTopArtist}
        keyExtractor={(item) => item.id}
        style={styles.topArtistsList}
        showsHorizontalScrollIndicator={false}
      />

      <Text style={[styles.sectionTitle, { color: colors.text }]}>All Artists</Text>
      <FlatList
        data={allArtists}
        renderItem={renderArtist}
        keyExtractor={(item) => item.id}
        numColumns={2}
        style={styles.artistsList}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 20,
  },
  topArtistsList: {
    paddingHorizontal: 10,
  },
  topArtistCard: {
    width: 150,
    marginHorizontal: 10,
    alignItems: 'center',
  },
  topArtistImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  topArtistName: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'center',
  },
  listenerCount: {
    fontSize: 14,
    marginTop: 5,
  },
  artistsList: {
    padding: 10,
  },
  artistCard: {
    flex: 1,
    margin: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  artistImage: {
    width: '100%',
    height: 150,
  },
  artistName: {
    fontSize: 16,
    fontWeight: '500',
    padding: 10,
    textAlign: 'center',
  },
});
