import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';

interface LabelHeaderProps {
  label: 'records' | 'tech' | 'deep';
  platformLinks: {
    spotify: string;
    beatport: string;
    soundcloud: string;
  };
}

const LabelHeader: React.FC<LabelHeaderProps> = ({ label, platformLinks }) => {
  const { colors } = useTheme();
  const navigation = useNavigation();

  const handlePlatformPress = (url: string) => {
    // Open platform URL
  };

  const handleArtistsPress = () => {
    navigation.navigate('Artists');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.platformLinks}>
        <TouchableOpacity
          style={[styles.platformButton, { backgroundColor: '#1DB954' }]}
          onPress={() => handlePlatformPress(platformLinks.spotify)}
        >
          <Ionicons name="logo-spotify" size={20} color="#FFFFFF" />
          <Text style={styles.platformText}>Spotify</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.platformButton, { backgroundColor: '#FF6B00' }]}
          onPress={() => handlePlatformPress(platformLinks.beatport)}
        >
          <Text style={[styles.beatportIcon, styles.platformText]}>B</Text>
          <Text style={styles.platformText}>Beatport</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.platformButton, { backgroundColor: '#FF7700' }]}
          onPress={() => handlePlatformPress(platformLinks.soundcloud)}
        >
          <Ionicons name="logo-soundcloud" size={20} color="#FFFFFF" />
          <Text style={styles.platformText}>SoundCloud</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.platformButton, { backgroundColor: colors.primary }]}
          onPress={handleArtistsPress}
        >
          <Ionicons name="people" size={20} color="#FFFFFF" />
          <Text style={styles.platformText}>Artists</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  platformLinks: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  platformButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  platformText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  beatportIcon: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default LabelHeader;
