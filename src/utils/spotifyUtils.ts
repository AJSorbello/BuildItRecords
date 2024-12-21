import { Artist as SpotifyArtist, Track as SpotifyTrack } from '@spotify/web-api-ts-sdk';
import { RecordLabel } from '../constants/labels';
import { Artist, SimpleArtist, SpotifyArtist as LocalSpotifyArtist } from '../types/artist';
import { Track, SpotifyTrack as LocalSpotifyTrack } from '../types/track';
import { Release, SpotifyRelease } from '../types/release';

export const isValidSpotifyUrl = (url: string): boolean => {
  if (!url) return false;
  try {
    const urlObj = new URL(url);
    return urlObj.hostname === 'open.spotify.com';
  } catch (error) {
    return false;
  }
};

export const normalizeSpotifyUrl = (url: string): string => {
  if (!url) return '';
  try {
    // Add https:// if missing
    if (!url.startsWith('http')) {
      url = `https://${url}`;
    }
    const urlObj = new URL(url);
    return urlObj.href.split('?')[0];
  } catch (error) {
    console.error('Error normalizing Spotify URL:', error);
    return url;
  }
};

export const extractSpotifyId = (url: string): string | null => {
  if (!url) return null;
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    return pathParts[pathParts.length - 1];
  } catch (error) {
    console.error('Error extracting Spotify ID:', error);
    return null;
  }
};

export const determineLabelFromUrl = (url: string): RecordLabel => {
  if (url.includes('records')) return RecordLabel.RECORDS;
  if (url.includes('tech')) return RecordLabel.TECH;
  if (url.includes('deep')) return RecordLabel.DEEP;
  return RecordLabel.RECORDS; // Default to Records
};

export const convertSpotifyArtistToArtist = (spotifyArtist: LocalSpotifyArtist, label: RecordLabel): Artist => {
  return {
    id: spotifyArtist.id,
    name: spotifyArtist.name,
    spotifyUrl: spotifyArtist.external_urls.spotify,
    recordLabel: label,
    bio: '',
    genres: spotifyArtist.genres,
    followers: { total: spotifyArtist.followers.total },
    images: spotifyArtist.images,
    labels: [label],
    releases: [],
    imageUrl: spotifyArtist.images[0]?.url
  };
};

export const convertSpotifyTrackToTrack = (spotifyTrack: LocalSpotifyTrack, label: RecordLabel): Track => {
  const artist: SimpleArtist = {
    id: spotifyTrack.artists[0]?.id || '',
    name: spotifyTrack.artists[0]?.name || '',
    spotifyUrl: spotifyTrack.artists[0]?.external_urls?.spotify || '',
    recordLabel: label
  };

  const artists: SimpleArtist[] = spotifyTrack.artists.map(a => ({
    id: a.id,
    name: a.name,
    spotifyUrl: a.external_urls.spotify,
    recordLabel: label
  }));

  return {
    id: spotifyTrack.id,
    name: spotifyTrack.name,
    trackTitle: spotifyTrack.name,
    artist,
    artists,
    album: {
      id: spotifyTrack.album.id,
      name: spotifyTrack.album.name,
      releaseDate: spotifyTrack.album.release_date,
      totalTracks: spotifyTrack.album.total_tracks,
      images: spotifyTrack.album.images
    },
    releaseDate: spotifyTrack.album.release_date,
    imageUrl: spotifyTrack.album.images[0]?.url || '',
    spotifyUrl: spotifyTrack.external_urls.spotify,
    previewUrl: spotifyTrack.preview_url,
    recordLabel: label
  };
};

export const convertSpotifyReleaseToRelease = (spotifyRelease: SpotifyRelease, label: RecordLabel): Release => {
  return {
    id: spotifyRelease.id,
    title: spotifyRelease.name,
    name: spotifyRelease.name,
    artist: {
      id: spotifyRelease.artists[0]?.id || '',
      name: spotifyRelease.artists[0]?.name || '',
      spotifyUrl: spotifyRelease.artists[0]?.external_urls?.spotify || '',
      recordLabel: label
    },
    imageUrl: spotifyRelease.images[0]?.url || '',
    releaseDate: spotifyRelease.release_date,
    recordLabel: label,
    spotifyUrl: spotifyRelease.external_urls.spotify
  };
};

export const formatDuration = (ms: number): string => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};
