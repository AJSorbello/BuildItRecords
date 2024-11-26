import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';

export default function AboutScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>About BuildIt Records</Text>
        <Text style={styles.text}>
          BuildIt Records is a state-of-the-art music production studio dedicated to helping artists
          bring their musical vision to life. With our professional equipment and experienced team,
          we provide top-quality recording, mixing, and mastering services.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.subtitle}>Our Services</Text>
        <View style={styles.serviceList}>
          <View style={styles.serviceItem}>
            <Text style={styles.serviceTitle}>Recording</Text>
            <Text style={styles.serviceText}>
              Professional recording services with state-of-the-art equipment
            </Text>
          </View>

          <View style={styles.serviceItem}>
            <Text style={styles.serviceTitle}>Mixing</Text>
            <Text style={styles.serviceText}>
              Expert mixing to ensure your music sounds its absolute best
            </Text>
          </View>

          <View style={styles.serviceItem}>
            <Text style={styles.serviceTitle}>Mastering</Text>
            <Text style={styles.serviceText}>
              Final touch to make your music ready for distribution
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  section: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  serviceList: {
    gap: 15,
  },
  serviceItem: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#f4511e',
  },
  serviceText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
