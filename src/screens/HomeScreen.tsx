import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, Linking } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function HomeScreen({ navigation }: Props) {
  const { colors } = useTheme();

  const openSpotify = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.hero, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>Build It Records</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Electronic Music Label Group
        </Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity 
          style={[styles.card, { backgroundColor: colors.border }]}
          onPress={() => openSpotify('https://open.spotify.com/user/builditrecords')}
        >
          <View style={styles.cardHeader}>
            <Ionicons name="musical-notes" size={24} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Build It Records</Text>
          </View>
          <Text style={[styles.cardText, { color: colors.textSecondary }]}>
            House & Techno releases from established and emerging artists
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.card, { backgroundColor: colors.border }]}
          onPress={() => openSpotify('https://open.spotify.com/user/buildittech')}
        >
          <View style={styles.cardHeader}>
            <Ionicons name="pulse" size={24} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Build It Tech</Text>
          </View>
          <Text style={[styles.cardText, { color: colors.textSecondary }]}>
            Cutting-edge techno and experimental electronic music
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.card, { backgroundColor: colors.border }]}
          onPress={() => openSpotify('https://open.spotify.com/user/builditdeep')}
        >
          <View style={styles.cardHeader}>
            <Ionicons name="water" size={24} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Build It Deep</Text>
          </View>
          <Text style={[styles.cardText, { color: colors.textSecondary }]}>
            Deep house, melodic techno, and progressive sounds
          </Text>
        </TouchableOpacity>
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
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
  },
  content: {
    padding: 20,
  },
  card: {
    borderRadius: 8,
    padding: 20,
    marginBottom: 15,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  cardText: {
    fontSize: 16,
    lineHeight: 22,
  },
});
