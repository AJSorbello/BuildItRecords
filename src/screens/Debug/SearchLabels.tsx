import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import SpotifyService from '../../services/SpotifyService';

export default function SearchLabels() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [error, setError] = useState('');

  // Initialize with the Build It Records track
  useEffect(() => {
    const trackId = '3Fgh73g1qtOyWRdcDceWbd';
    lookupTrack(trackId);
  }, []);

  const lookupTrack = async (trackId: string) => {
    try {
      const spotify = new SpotifyService();
      const result = await spotify.getTrackDetails(trackId);
      setSearchResults(result.artists);
      setError('');
    } catch (err) {
      setError('Error looking up track: ' + (err as Error).message);
    }
  };

  const handleSearch = async () => {
    try {
      const spotify = new SpotifyService();
      const results = await spotify.searchArtist(searchQuery);
      setSearchResults(results);
      setError('');
    } catch (err) {
      setError('Error searching: ' + (err as Error).message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Label Information</Text>
      
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.input}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search for additional artists..."
          placeholderTextColor="#666"
        />
        <TouchableOpacity style={styles.button} onPress={handleSearch}>
          <Text style={styles.buttonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <ScrollView style={styles.results}>
          {searchResults.map((artist, index) => (
            <View key={index} style={styles.resultItem}>
              <Text style={styles.artistName}>{artist.name}</Text>
              <Text style={styles.artistId}>ID: {artist.id}</Text>
              <Text style={styles.artistDetails}>
                Genres: {artist.genres.join(', ') || 'None'}
              </Text>
              <Text style={styles.artistDetails}>
                Followers: {artist.followers.total.toLocaleString()}
              </Text>
              {artist.images && artist.images.length > 0 && (
                <Text style={styles.artistDetails}>
                  Profile Image URL: {artist.images[0].url}
                </Text>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#121212',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: '#282828',
    borderRadius: 4,
    paddingHorizontal: 10,
    marginRight: 10,
    color: '#fff',
  },
  button: {
    backgroundColor: '#1DB954',
    paddingHorizontal: 20,
    justifyContent: 'center',
    borderRadius: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  results: {
    flex: 1,
  },
  resultItem: {
    backgroundColor: '#282828',
    padding: 15,
    borderRadius: 4,
    marginBottom: 10,
  },
  artistName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  artistId: {
    fontSize: 14,
    color: '#1DB954',
    marginBottom: 5,
  },
  artistDetails: {
    fontSize: 14,
    color: '#b3b3b3',
    marginBottom: 3,
  },
  error: {
    color: '#ff4444',
    marginTop: 10,
  },
});
