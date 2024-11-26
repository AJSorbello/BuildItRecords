import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import DateTimePicker from '@react-native-community/datetimepicker';

interface ReleaseFormData {
  title: string;
  artist: string;
  imageUrl: string;
  releaseDate: Date;
  spotifyUrl: string;
  beatportUrl: string;
  soundcloudUrl: string;
  label: string;
  genre: string;
}

export const ReleaseForm = () => {
  const { colors } = useTheme();
  const [formData, setFormData] = useState<ReleaseFormData>({
    title: '',
    artist: '',
    imageUrl: '',
    releaseDate: new Date(),
    spotifyUrl: '',
    beatportUrl: '',
    soundcloudUrl: '',
    label: '',
    genre: '',
  });

  const handleSubmit = () => {
    // TODO: Implement submission logic
    console.log('Form submitted:', formData);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>New Release</Text>
      
      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: colors.text }]}>Title</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
          value={formData.title}
          onChangeText={(text) => setFormData({ ...formData, title: text })}
          placeholder="Release Title"
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: colors.text }]}>Artist</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
          value={formData.artist}
          onChangeText={(text) => setFormData({ ...formData, artist: text })}
          placeholder="Artist Name"
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: colors.text }]}>Cover Art URL</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
          value={formData.imageUrl}
          onChangeText={(text) => setFormData({ ...formData, imageUrl: text })}
          placeholder="Image URL"
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: colors.text }]}>Spotify URL</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
          value={formData.spotifyUrl}
          onChangeText={(text) => setFormData({ ...formData, spotifyUrl: text })}
          placeholder="Spotify URL"
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: colors.text }]}>Beatport URL</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
          value={formData.beatportUrl}
          onChangeText={(text) => setFormData({ ...formData, beatportUrl: text })}
          placeholder="Beatport URL"
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: colors.text }]}>SoundCloud URL</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
          value={formData.soundcloudUrl}
          onChangeText={(text) => setFormData({ ...formData, soundcloudUrl: text })}
          placeholder="SoundCloud URL"
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      <TouchableOpacity
        style={[styles.submitButton, { backgroundColor: colors.primary }]}
        onPress={handleSubmit}
      >
        <Text style={styles.submitButtonText}>Add Release</Text>
      </TouchableOpacity>
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
  formGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    height: 40,
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  submitButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
