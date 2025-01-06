import { Track } from '../types/track';
import { Artist } from '../types/artist';
import { Album } from '../types/release';
import { 
  type Track as SpotifyTrack, 
  type Artist as SpotifyArtist,
  type SimplifiedArtist, 
  type SimplifiedAlbum,
  type Album as SpotifyAlbum 
} from '@spotify/web-api-ts-sdk';

// Convert a Spotify track to our Track type
export const transformSpotifyTrack = (spotifyTrack: SpotifyTrack): Track => {
  return {
    id: spotifyTrack.id,
    name: spotifyTrack.name,
    title: spotifyTrack.name,
    artists: spotifyTrack.artists.map(artist => ({
      id: artist.id,
      name: artist.name,
      uri: artist.uri,
      external_urls: artist.external_urls,
      spotifyUrl: artist.external_urls.spotify
    })),
    duration_ms: spotifyTrack.duration_ms,
    preview_url: spotifyTrack.preview_url,
    external_urls: {
      spotify: spotifyTrack.external_urls.spotify
    },
    external_ids: spotifyTrack.external_ids,
    uri: spotifyTrack.uri,
    album: transformSpotifyAlbum(spotifyTrack.album),
    popularity: spotifyTrack.popularity,
    releaseDate: spotifyTrack.album.release_date,
    spotifyUrl: spotifyTrack.external_urls.spotify,
    images: spotifyTrack.album.images || []
  };
};

// Convert a Spotify artist to our Artist type
export const transformSpotifyArtist = (spotifyArtist: SpotifyArtist | SimplifiedArtist): Artist => {
  return {
    id: spotifyArtist.id,
    name: spotifyArtist.name,
    uri: spotifyArtist.uri,
    external_urls: spotifyArtist.external_urls,
    spotifyUrl: spotifyArtist.external_urls.spotify,
    images: 'images' in spotifyArtist ? spotifyArtist.images : [],
    genres: 'genres' in spotifyArtist ? spotifyArtist.genres : [],
    popularity: 'popularity' in spotifyArtist ? spotifyArtist.popularity : undefined
  };
};

// Convert a Spotify album to our Album type
export const transformSpotifyAlbum = (spotifyAlbum: SpotifyAlbum | SimplifiedAlbum): Album => {
  return {
    id: spotifyAlbum.id,
    name: spotifyAlbum.name,
    artists: spotifyAlbum.artists.map(artist => ({
      id: artist.id,
      name: artist.name,
      uri: artist.uri,
      external_urls: artist.external_urls,
      spotifyUrl: artist.external_urls.spotify
    })),
    release_date: spotifyAlbum.release_date,
    release_date_precision: spotifyAlbum.release_date_precision,
    total_tracks: spotifyAlbum.total_tracks,
    uri: spotifyAlbum.uri,
    external_urls: spotifyAlbum.external_urls,
    images: spotifyAlbum.images,
    type: spotifyAlbum.type,
    spotifyUrl: spotifyAlbum.external_urls.spotify
  };
};
