import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '../../contexts/ThemeContext';
import { spotifyService } from '../../services/spotify';
import { soundcloudService } from '../../services/soundcloud';
import { csvService, SymphonicRelease } from '../../services/csv';

interface ReleaseData {
  identifier: string;
  identifierType: 'UPC' | 'ISRC';
  title: string;
  artist: string;
  imageUrl: string;
  releaseDate: string;
  spotifyUrl: string;
  soundcloudUrl: string;
  label: 'records' | 'tech' | 'deep';
}

export const ReleaseManagerScreen = () => {
  const { colors } = useTheme();
  const [identifier, setIdentifier] = useState('');
  const [isUPC, setIsUPC] = useState(false);
  const [loading, setLoading] = useState(false);
  const [releaseData, setReleaseData] = useState<ReleaseData | null>(null);
  const [symphonicData, setSymphonicData] = useState<SymphonicRelease | null>(null);

  const handleImportCSV = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/csv',
        copyToCacheDirectory: true,
      });

      if (result.type === 'success') {
        await csvService.importCSV(result.uri);
        Alert.alert('Success', 'CSV file imported successfully');
      }
    } catch (error) {
      console.error('Error importing CSV:', error);
      Alert.alert('Error', 'Failed to import CSV file');
    }
  };

  const fetchReleaseData = async () => {
    if (!identifier) {
      Alert.alert('Error', 'Please enter an ISRC or UPC');
      return;
    }

    setLoading(true);
    try {
      let spotifyData;
      let soundcloudData;
      let symphonic;

      if (isUPC) {
        // Try to find the release in Symphonic data first
        symphonic = csvService.findReleaseByUPC(identifier);
        if (!symphonic) {
          Alert.alert('Error', 'UPC not found in Symphonic data');
          return;
        }
        setSymphonicData(symphonic);
        
        // Use the ISRC from Symphonic data to fetch from platforms
        [spotifyData, soundcloudData] = await Promise.all([
          spotifyService.getTrackByISRC(symphonic.isrc),
          soundcloudService.getTrackByISRC(symphonic.isrc),
        ]);
      } else {
        // Check if we have Symphonic data for this ISRC
        symphonic = csvService.findReleaseByISRC(identifier);
        if (symphonic) {
          setSymphonicData(symphonic);
        }
        
        // Use ISRC directly with Spotify and SoundCloud
        [spotifyData, soundcloudData] = await Promise.all([
          spotifyService.getTrackByISRC(identifier),
          soundcloudService.getTrackByISRC(identifier),
        ]);
      }

      const releaseData: ReleaseData = {
        identifier,
        identifierType: isUPC ? 'UPC' : 'ISRC',
        title: symphonic?.title || spotifyData.title || soundcloudData.title,
        artist: symphonic?.artist || spotifyData.artist || soundcloudData.artist,
        imageUrl: spotifyData.imageUrl || soundcloudData.imageUrl,
        releaseDate: symphonic?.releaseDate || spotifyData.releaseDate || soundcloudData.releaseDate,
        spotifyUrl: spotifyData.spotifyUrl || '',
        soundcloudUrl: soundcloudData.soundcloudUrl || '',
        label: 'records',
      };

      setReleaseData(releaseData);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch release data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!releaseData) return;

    try {
      // TODO: Implement save to backend
      Alert.alert('Success', 'Release data saved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save release data');
      console.error(error);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Release Manager</Text>

      <TouchableOpacity
        style={[styles.importButton, { backgroundColor: colors.primary }]}
        onPress={handleImportCSV}
      >
        <Text style={styles.buttonText}>Import Symphonic CSV</Text>
      </TouchableOpacity>

      <View style={styles.identifierToggle}>
        <Text style={[styles.toggleLabel, { color: colors.text }]}>
          {isUPC ? 'UPC' : 'ISRC'}
        </Text>
        <Switch
          value={isUPC}
          onValueChange={setIsUPC}
          trackColor={{ false: colors.primary, true: colors.primary }}
        />
      </View>

      <View style={styles.searchSection}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
          placeholder={`Enter ${isUPC ? 'UPC' : 'ISRC'}`}
          placeholderTextColor={colors.textSecondary}
          value={identifier}
          onChangeText={setIdentifier}
          autoCapitalize="characters"
        />
        <TouchableOpacity
          style={[styles.searchButton, { backgroundColor: colors.primary }]}
          onPress={fetchReleaseData}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Fetch Data</Text>
          )}
        </TouchableOpacity>
      </View>

      {symphonicData && (
        <View style={[styles.symphonicContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.dataTitle, { color: colors.text }]}>Symphonic Data</Text>
          <View style={styles.dataRow}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>UPC:</Text>
            <Text style={[styles.value, { color: colors.text }]}>{symphonicData.upc}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>ISRC:</Text>
            <Text style={[styles.value, { color: colors.text }]}>{symphonicData.isrc}</Text>
          </View>
        </View>
      )}

      {releaseData && (
        <View style={[styles.releaseDataContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.dataTitle, { color: colors.text }]}>Release Information</Text>
          
          <View style={styles.dataRow}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Title:</Text>
            <Text style={[styles.value, { color: colors.text }]}>{releaseData.title}</Text>
          </View>

          <View style={styles.dataRow}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Artist:</Text>
            <Text style={[styles.value, { color: colors.text }]}>{releaseData.artist}</Text>
          </View>

          <View style={styles.dataRow}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Release Date:</Text>
            <Text style={[styles.value, { color: colors.text }]}>{releaseData.releaseDate}</Text>
          </View>

          <View style={styles.platformLinks}>
            <Text style={[styles.platformTitle, { color: colors.text }]}>Platform Links</Text>
            {releaseData.spotifyUrl && (
              <Text style={[styles.platformUrl, { color: colors.primary }]}>
                {releaseData.spotifyUrl}
              </Text>
            )}
            {releaseData.soundcloudUrl && (
              <Text style={[styles.platformUrl, { color: colors.primary }]}>
                {releaseData.soundcloudUrl}
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            onPress={handleSave}
          >
            <Text style={styles.buttonText}>Save as Latest Release</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  identifierToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    justifyContent: 'flex-end',
  },
  toggleLabel: {
    marginRight: 10,
    fontSize: 16,
    fontWeight: '600',
  },
  searchSection: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  searchButton: {
    paddingHorizontal: 20,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  releaseDataContainer: {
    padding: 20,
    borderRadius: 12,
    marginTop: 20,
  },
  dataTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  dataRow: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  label: {
    width: 100,
    fontSize: 16,
  },
  value: {
    flex: 1,
    fontSize: 16,
  },
  platformLinks: {
    marginTop: 20,
  },
  platformTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  platformUrl: {
    fontSize: 14,
    marginBottom: 8,
  },
  saveButton: {
    marginTop: 20,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  importButton: {
    marginBottom: 20,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  symphonicContainer: {
    padding: 20,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 20,
  },
});
