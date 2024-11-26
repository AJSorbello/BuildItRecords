import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Image, Linking, TouchableOpacity } from 'react-native';
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
    backgroundColor: '#121212',
    color: '#FFFFFF',
  },
});

const techData = {
  title: 'Build It Tech',
  icon: require('../assets/png/tech/BuildIt_Tech_Square.png'),
  links: {
    spotify: 'https://open.spotify.com/user/buildittechrecords',
    beatport: 'https://www.beatport.com/label/build-it-tech/89646',
    soundcloud: 'https://soundcloud.com/buildittechrecords'
  },
  playlists: [
    { id: '1', name: 'Techno Essentials', url: 'https://open.spotify.com/playlist/37i9dQZF1DX6J5NfMJS675' },
    { id: '2', name: 'Peak Time Techno', url: 'https://open.spotify.com/playlist/37i9dQZF1DX5xiztvBdlUf' }
  ],
  bandcamp: [
    { id: '1', name: 'Latest Releases', url: 'https://buildittechrecords.bandcamp.com' },
    { id: '2', name: 'Featured Artists', url: 'https://buildittechrecords.bandcamp.com/artists' }
  ]
};

export const TechSidebar = () => {
  const labelArtists = getArtistsByLabel('tech');

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
          <Image source={techData.icon} style={styles.labelIcon} />
          <Text style={[styles.headerTitle, { color: '#FFFFFF' }]}>{techData.title}</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: '#FFFFFF' }]}>Platforms</Text>
          <TouchableOpacity
            style={styles.platformButton}
            onPress={() => handlePlatformClick(techData.links.spotify)}
          >
            <Ionicons name="musical-notes" size={24} color="#FFFFFF" />
            <Text style={[styles.platformButtonText, { color: '#FFFFFF' }]}>Spotify</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.platformButton}
            onPress={() => handlePlatformClick(techData.links.beatport)}
          >
            <Ionicons name="cart" size={24} color="#FFFFFF" />
            <Text style={[styles.platformButtonText, { color: '#FFFFFF' }]}>Beatport</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.platformButton}
            onPress={() => handlePlatformClick(techData.links.soundcloud)}
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
          {techData.playlists.map((playlist) => (
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
          {techData.bandcamp.map((item) => (
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
        '& .MuiDrawer-paper': {
          backgroundColor: '#121212',
          borderRight: '1px solid rgba(255, 255, 255, 0.12)',
          color: '#FFFFFF',
          '& .MuiListItem-root': {
            '&:hover': {
              backgroundColor: 'rgba(2, 255, 149, 0.25)',
            },
          },
          '& .MuiListItemIcon-root': {
            color: '#FFFFFF',
          },
          '& .MuiListItemText-primary': {
            color: '#FFFFFF',
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
            <Image source={techData.icon} style={{ width: 40, height: 40 }} />
          </ListItemIcon>
          <ListItemText 
            primary={techData.title}
            primaryTypographyProps={{ variant: 'h6', style: { color: '#FFFFFF' } }}
          />
        </ListItem>

        <Divider />

        <ListItem button onClick={() => handlePlatformClick(techData.links.spotify)}>
          <ListItemIcon>
            <FaSpotify size={24} />
          </ListItemIcon>
          <ListItemText primary="Spotify" />
        </ListItem>

        <ListItem button onClick={() => handlePlatformClick(techData.links.beatport)}>
          <ListItemIcon>
            <SiBeatport size={24} />
          </ListItemIcon>
          <ListItemText primary="Beatport" />
        </ListItem>

        <ListItem button onClick={() => handlePlatformClick(techData.links.soundcloud)}>
          <ListItemIcon>
            <FaSoundcloud size={24} />
          </ListItemIcon>
          <ListItemText primary="SoundCloud" />
        </ListItem>

        <Divider />

        <ListSubheader
          sx={{
            backgroundColor: '#121212',
            color: '#FFFFFF',
          }}
        >
          Artists
        </ListSubheader>
        {labelArtists.map((artist) => (
          <ListItem 
            button 
            key={artist.id}
            onClick={() => handlePlatformClick(artist.spotifyUrl)}
          >
            <ListItemIcon>
              <Ionicons name="person" size={20} color="#FFFFFF" />
            </ListItemIcon>
            <ListItemText primary={artist.name} />
          </ListItem>
        ))}

        <Divider />

        <ListSubheader
          sx={{
            backgroundColor: '#121212',
            color: '#FFFFFF',
          }}
        >
          Playlists
        </ListSubheader>
        {techData.playlists.map((playlist) => (
          <ListItem 
            button 
            key={playlist.id}
            onClick={() => handlePlatformClick(playlist.url)}
          >
            <ListItemIcon>
              <Ionicons name="musical-notes" size={20} color="#FFFFFF" />
            </ListItemIcon>
            <ListItemText primary={playlist.name} />
          </ListItem>
        ))}

        <Divider />

        <ListSubheader
          sx={{
            backgroundColor: '#121212',
            color: '#FFFFFF',
          }}
        >
          Bandcamp
        </ListSubheader>
        {techData.bandcamp.map((item) => (
          <ListItem 
            button 
            key={item.id}
            onClick={() => handlePlatformClick(item.url)}
          >
            <ListItemIcon>
              <Ionicons name="cart" size={20} color="#FFFFFF" />
            </ListItemIcon>
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
    width: drawerWidth,
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.12)',
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
    paddingVertical: 8,
  },
  platformButtonText: {
    marginLeft: 12,
    fontSize: 16,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  itemText: {
    marginLeft: 12,
    fontSize: 14,
  },
});
