import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Linking,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useTheme } from '../contexts/ThemeContext';

interface Track {
  id: string;
  title: string;
  artist: string;
  duration: string;
  spotifyId: string;
  previewUrl?: string | null;
}

interface Release {
  id: string;
  title: string;
  artist: string;
  artwork: string;
  releaseDate: string;
  spotifyLink: string;
  tracks: Track[];
  label: string;
  spotifyUrl: string;
  beatportUrl: string;
  soundcloudUrl: string;
}

interface ReleaseCardProps {
  release: Release;
  compact?: boolean;
  featured?: boolean;
}

const ReleaseCard: React.FC<ReleaseCardProps> = ({ release, compact = false, featured = false }) => {
  const { colors } = useTheme();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handlePlayPause = async (track: Track) => {
    if (!track.previewUrl) {
      return;
    }

    if (isPlaying && currentTrack?.id === track.id) {
      await sound?.pauseAsync();
      setIsPlaying(false);
    } else {
      if (sound) {
        await sound.unloadAsync();
      }

      try {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: track.previewUrl },
          { shouldPlay: true },
          (status) => {
            if (status.didJustFinish) {
              setIsPlaying(false);
              setCurrentTrack(null);
            }
          }
        );
        setSound(newSound);
        setCurrentTrack(track);
        setIsPlaying(true);
      } catch (error) {
        console.error('Error playing track:', error);
      }
    }
  };

  React.useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const cardWidth = featured
    ? Dimensions.get('window').width - 40 // Full width minus padding
    : (Dimensions.get('window').width - 50) / 2; // Half width minus padding and gap

  if (compact) {
    return (
      <View style={[styles.compactContainer, { backgroundColor: colors.background }]}>
        <Image source={{ uri: release.artwork }} style={styles.compactArtwork} />
        <View style={styles.compactInfo}>
          <View>
            <Text style={[styles.compactArtist, { color: colors.text }]}>{release.artist}</Text>
            <Text style={[styles.compactTitle, { color: colors.text }]}>{release.title}</Text>
            <Text style={[styles.compactDate, { color: colors.textSecondary }]}>
              {new Date(release.releaseDate).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.compactButtons}>
            <TouchableOpacity
              style={[styles.compactButton, { backgroundColor: '#1DB954' }]}
              onPress={() => Linking.openURL(release.spotifyUrl)}
            >
              <Ionicons name="logo-spotify" size={16} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.compactButton, { backgroundColor: '#FF6B00' }]}
              onPress={() => Linking.openURL(release.beatportUrl)}
            >
              <Text style={styles.compactButtonText}>BP</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.compactButton, { backgroundColor: '#FF5500' }]}
              onPress={() => Linking.openURL(release.soundcloudUrl)}
            >
              <Ionicons name="logo-soundcloud" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[
      styles.card,
      {
        backgroundColor: colors.cardBackground,
        width: cardWidth
      }
    ]}>
      <Image
        source={{ uri: release.artwork }}
        style={[
          styles.artwork,
          featured && styles.featuredArtwork
        ]}
      />
      
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>{release.title}</Text>
        <Text style={[styles.artist, { color: colors.textSecondary }]}>{release.artist}</Text>
        <Text style={[styles.date, { color: colors.textTertiary }]}>{formatDate(release.releaseDate)}</Text>

        <View style={styles.tracks}>
          {release.tracks.map((track) => (
            <View key={track.id} style={[styles.track, { borderBottomColor: colors.border }]}>
              <TouchableOpacity
                style={styles.playButton}
                onPress={() => handlePlayPause(track)}
                disabled={!track.previewUrl}
              >
                <Ionicons
                  name={isPlaying && currentTrack?.id === track.id ? 'pause' : 'play'}
                  size={20}
                  color={track.previewUrl ? colors.primary : colors.textTertiary}
                />
              </TouchableOpacity>
              <View style={styles.trackInfo}>
                <Text style={[styles.trackTitle, { color: colors.text }]}>{track.title}</Text>
                <Text style={[styles.trackArtist, { color: colors.textSecondary }]}>{track.artist}</Text>
              </View>
              <Text style={[styles.duration, { color: colors.textTertiary }]}>{track.duration}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.spotifyButton, { backgroundColor: colors.primary }]}
          onPress={() => Linking.openURL(release.spotifyLink)}
        >
          <Ionicons name="logo-spotify" size={20} color="#FFFFFF" />
          <Text style={styles.spotifyButtonText}>Listen on Spotify</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  artwork: {
    width: '100%',
    aspectRatio: 1,
  },
  featuredArtwork: {
    height: 300,
  },
  content: {
    padding: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  artist: {
    fontSize: 16,
    marginBottom: 5,
  },
  date: {
    fontSize: 14,
    marginBottom: 15,
  },
  tracks: {
    marginBottom: 15,
  },
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  playButton: {
    width: 30,
    alignItems: 'center',
  },
  trackInfo: {
    flex: 1,
    marginLeft: 10,
  },
  trackTitle: {
    fontSize: 14,
  },
  trackArtist: {
    fontSize: 12,
  },
  duration: {
    fontSize: 12,
    marginLeft: 10,
  },
  spotifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 25,
  },
  spotifyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    padding: 10,
    marginVertical: 5,
    borderRadius: 8,
    alignItems: 'center',
  },
  compactArtwork: {
    width: 80,
    height: 80,
    borderRadius: 5,
    marginRight: 15,
  },
  compactInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compactArtist: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  compactTitle: {
    fontSize: 14,
    marginBottom: 3,
  },
  compactDate: {
    fontSize: 12,
  },
  compactButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  compactButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default ReleaseCard;
