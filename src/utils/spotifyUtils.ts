import { Artist, SpotifyArtistData } from '../types/artist';
import { Track, SpotifyTrack } from '../types/track';
import { Album, Release, SpotifyAlbum } from '../types/release';
import { RecordLabel, RECORD_LABELS } from '../constants/labels';

export const createArtistFromSpotify = (
  spotifyArtist: SpotifyArtistData,
  label: RecordLabel = RecordLabel.RECORDS
): Artist => {
  return {
    id: spotifyArtist.id,
    name: spotifyArtist.name,
    images: spotifyArtist.images || [],
    genres: spotifyArtist.genres || [],
    external_urls: {
      spotify: spotifyArtist.external_urls.spotify
    },
    followers: spotifyArtist.followers,
    popularity: spotifyArtist.popularity,
    label,
    bio: '',
    artworkUrl: spotifyArtist.images?.[0]?.url || '',
    spotifyUrl: spotifyArtist.external_urls.spotify
  };
};

export const createTrackFromSpotify = (
  spotifyTrack: SpotifyTrack,
  label: RecordLabel = RecordLabel.RECORDS
): Track => {
  return {
    id: spotifyTrack.id,
    title: spotifyTrack.name,
    name: spotifyTrack.name,
    artists: spotifyTrack.artists.map(artist => ({
      id: artist.id,
      name: artist.name,
      external_urls: {
        spotify: artist.external_urls.spotify
      }
    })),
    duration_ms: spotifyTrack.duration_ms,
    preview_url: spotifyTrack.preview_url || undefined,
    external_urls: {
      spotify: spotifyTrack.external_urls.spotify
    },
    uri: spotifyTrack.uri,
    label,
    releaseDate: spotifyTrack.album.release_date,
    artworkUrl: spotifyTrack.album.images[0]?.url || '',
    featured: false,
    popularity: spotifyTrack.popularity
  };
};

export const createAlbumFromSpotify = (
  spotifyAlbum: SpotifyAlbum,
  label: RecordLabel = RecordLabel.RECORDS
): Album => {
  return {
    id: spotifyAlbum.id,
    title: spotifyAlbum.name,
    name: spotifyAlbum.name,
    artists: spotifyAlbum.artists.map(artist => ({
      id: artist.id,
      name: artist.name,
      external_urls: {
        spotify: artist.external_urls.spotify
      }
    })),
    releaseDate: spotifyAlbum.release_date,
    total_tracks: spotifyAlbum.total_tracks,
    tracks: spotifyAlbum.tracks?.items.map(track => createTrackFromSpotify({
      ...track,
      album: spotifyAlbum,
      popularity: 0,
      external_ids: {}
    }, label)),
    external_urls: {
      spotify: spotifyAlbum.external_urls.spotify
    },
    label,
    popularity: spotifyAlbum.popularity,
    artworkUrl: spotifyAlbum.images[0]?.url || '',
    images: spotifyAlbum.images,
    spotifyUrl: spotifyAlbum.external_urls.spotify
  };
};

export const createReleaseFromSpotify = (
  spotifyAlbum: SpotifyAlbum,
  label: RecordLabel = RecordLabel.RECORDS
): Release => {
  return {
    ...createAlbumFromSpotify(spotifyAlbum, label),
    artist: spotifyAlbum.artists[0]?.name || ''
  };
};
