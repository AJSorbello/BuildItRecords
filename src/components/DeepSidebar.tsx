import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Image, Linking } from 'react-native';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, styled, Divider, ListSubheader } from '@mui/material';
import { FaSpotify, FaSoundcloud } from 'react-icons/fa';
import { SiBeatport } from 'react-icons/si';
import { Ionicons } from '@expo/vector-icons';
import { getArtistsByLabel } from '../data/artists';

const drawerWidth = 280;

const StyledDrawer = styled(Drawer)({
  width: drawerWidth,
  flexShrink: 0,
  '& .MuiDrawer-paper': {
    width: drawerWidth,
    boxSizing: 'border-box',
  },
});

const deepData = {
  title: 'Build It Deep',
  icon: require('../assets/png/deep/BuildIt_Deep_Square.png'),
  links: {
    spotify: 'https://open.spotify.com/user/builditdeeprecords',
    beatport: 'https://www.beatport.com/label/build-it-deep/89647',
    soundcloud: 'https://soundcloud.com/builditdeeprecords'
  },
  playlists: [
    { id: '1', name: 'Deep House Vibes', url: 'https://open.spotify.com/playlist/37i9dQZF1DX2TRYkJECvfC' },
    { id: '2', name: 'Deep Tech House', url: 'https://open.spotify.com/playlist/37i9dQZF1DX8Uebhn9wzrS' }
  ],
  bandcamp: [
    { id: '1', name: 'Latest Releases', url: 'https://builditdeeprecords.bandcamp.com' },
    { id: '2', name: 'Featured Artists', url: 'https://builditdeeprecords.bandcamp.com/artists' }
  ]
};

export const DeepSidebar = () => {
  const labelArtists = getArtistsByLabel('deep');

  const handlePlatformClick = (url: string) => {
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url);
    }
  };

  if (Platform.OS !== 'web') {
    return (
      <ScrollView style={[styles.container, { backgroundColor: '#121212' }]}>
        <View style={styles.header}>
          <Image source={deepData.icon} style={styles.labelIcon} />
          <Text style={[styles.headerTitle, { color: '#FFFFFF' }]}>{deepData.title}</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: '#FFFFFF' }]}>Platforms</Text>
          <TouchableOpacity
            style={styles.platformButton}
            onPress={() => handlePlatformClick(deepData.links.spotify)}
          >
            <Ionicons name="musical-notes" size={24} color="#FFFFFF" />
            <Text style={[styles.platformButtonText, { color: '#FFFFFF' }]}>Spotify</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.platformButton}
            onPress={() => handlePlatformClick(deepData.links.beatport)}
          >
            <Ionicons name="cart" size={24} color="#FFFFFF" />
            <Text style={[styles.platformButtonText, { color: '#FFFFFF' }]}>Beatport</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.platformButton}
            onPress={() => handlePlatformClick(deepData.links.soundcloud)}
          >
            <Ionicons name="cloud" size={24} color="#FFFFFF" />
            <Text style={[styles.platformButtonText, { color: '#FFFFFF' }]}>SoundCloud</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: '#FFFFFF' }]}>Artists</Text>
          {labelArtists.map((artist) => (
            <TouchableOpacity
              key={artist.id}
              style={styles.item}
              onPress={() => handlePlatformClick(artist.spotifyUrl)}
            >
              <Ionicons name="person" size={20} color="#FFFFFF" />
              <Text style={[styles.itemText, { color: '#FFFFFF' }]}>{artist.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: '#FFFFFF' }]}>Playlists</Text>
          {deepData.playlists.map((playlist) => (
            <TouchableOpacity
              key={playlist.id}
              style={styles.item}
              onPress={() => handlePlatformClick(playlist.url)}
            >
              <Ionicons name="musical-notes" size={20} color="#FFFFFF" />
              <Text style={[styles.itemText, { color: '#FFFFFF' }]}>{playlist.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: '#FFFFFF' }]}>Bandcamp</Text>
          {deepData.bandcamp.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.item}
              onPress={() => handlePlatformClick(item.url)}
            >
              <Ionicons name="cart" size={20} color="#FFFFFF" />
              <Text style={[styles.itemText, { color: '#FFFFFF' }]}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    );
  }

  return (
    <StyledDrawer
      variant="permanent"
      anchor="left"
      sx={{
        width: drawerWidth,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          backgroundColor: '#121212',
          borderRight: '1px solid rgba(255, 255, 255, 0.12)',
          '& .MuiListItem-root': {
            '&:hover': {
              backgroundColor: 'rgba(2, 255, 149, 0.25)',
            },
          },
          '& .MuiListItemText-primary, & .MuiListItemText-secondary': {
            color: '#FFFFFF',
          },
          '& .MuiTypography-root': {
            color: '#FFFFFF',
          },
          '& .MuiListItemIcon-root': {
            minWidth: '40px',
            color: '#FFFFFF',
            '& svg': {
              color: '#FFFFFF',
              transition: 'color 0.2s ease',
            },
            '&:hover svg': {
              color: 'rgba(2, 255, 149, 0.25) !important',
            },
          },
          '& .MuiDivider-root': {
            borderColor: 'rgba(255, 255, 255, 0.12)',
          },
        },
      }}
    >
      <List>
        <ListItem>
          <ListItemIcon>
            <Image source={deepData.icon} style={{ width: 40, height: 40 }} />
          </ListItemIcon>
          <ListItemText 
            primary={deepData.title}
            primaryTypographyProps={{ variant: 'h6' }}
          />
        </ListItem>

        <Divider />

        {/* Platform Links */}
        <ListItem button onClick={() => handlePlatformClick(deepData.links.spotify)}>
          <ListItemIcon>
            <FaSpotify />
          </ListItemIcon>
          <ListItemText primary="Spotify" />
        </ListItem>

        <ListItem button onClick={() => handlePlatformClick(deepData.links.beatport)}>
          <ListItemIcon>
            <SiBeatport />
          </ListItemIcon>
          <ListItemText primary="Beatport" />
        </ListItem>

        <ListItem button onClick={() => handlePlatformClick(deepData.links.soundcloud)}>
          <ListItemIcon>
            <FaSoundcloud />
          </ListItemIcon>
          <ListItemText primary="SoundCloud" />
        </ListItem>

        <Divider />

        {/* Artists Section */}
        <ListSubheader sx={{ backgroundColor: '#121212', color: '#FFFFFF' }}>
          Artists
        </ListSubheader>
        {labelArtists.map((artist) => (
          <ListItem 
            button 
            key={artist.id}
            onClick={() => handlePlatformClick(artist.spotifyUrl)}
          >
            <ListItemText primary={artist.name} />
          </ListItem>
        ))}

        <Divider />

        {/* Playlists Section */}
        <ListSubheader sx={{ backgroundColor: '#121212', color: '#FFFFFF' }}>
          Playlists
        </ListSubheader>
        {deepData.playlists.map((playlist) => (
          <ListItem 
            button 
            key={playlist.id}
            onClick={() => handlePlatformClick(playlist.url)}
          >
            <ListItemText primary={playlist.name} />
          </ListItem>
        ))}

        <Divider />

        {/* Bandcamp Section */}
        <ListSubheader sx={{ backgroundColor: '#121212', color: '#FFFFFF' }}>
          Bandcamp
        </ListSubheader>
        {deepData.bandcamp.map((item) => (
          <ListItem 
            button 
            key={item.id}
            onClick={() => handlePlatformClick(item.url)}
          >
            <ListItemText primary={item.name} />
          </ListItem>
        ))}
      </List>
    </StyledDrawer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: 280,
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelIcon: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.12)',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  platformButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  platformButtonText: {
    marginLeft: 12,
    fontSize: 16,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
  },
  itemText: {
    marginLeft: 12,
    fontSize: 14,
  },
});
