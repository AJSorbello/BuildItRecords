import { spotifyService } from '../SpotifyService';
import fetchMock from 'jest-fetch-mock';
import { describe, it, expect } from '@jest/globals';

describe('SpotifyService', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it('should fetch track by id', async () => {
    const mockTrackResponse = {
      id: '3z8h0TU7ReDPLIbEnYhWZb',
      title: 'Bohemian Rhapsody',
      artists: [
        {
          id: '1',
          name: 'Queen',
          external_urls: {
            spotify: 'https://open.spotify.com/artist/1'
          },
          uri: 'spotify:artist:1'
        }
      ],
      album: {
        id: '1',
        name: 'Bohemian Rhapsody (The Original Soundtrack)',
        release_date: '2018-10-19',
        images: [
          {
            url: 'https://example.com/image.jpg',
            height: 300,
            width: 300
          }
        ],
        external_urls: {
          spotify: 'https://open.spotify.com/album/1'
        },
        uri: 'spotify:album:1',
        total_tracks: 22
      },
      duration_ms: 354947,
      track_number: 1,
      disc_number: 1,
      preview_url: 'https://example.com/preview.mp3',
      external_urls: {
        spotify: 'https://open.spotify.com/track/3z8h0TU7ReDPLIbEnYhWZb'
      },
      uri: 'spotify:track:3z8h0TU7ReDPLIbEnYhWZb',
      external_ids: {
        isrc: 'GBUM71029604'
      },
      explicit: false,
      popularity: 72,
      available_markets: ['US', 'GB'],
      is_local: false
    };

    // Mock both token and track requests
    fetchMock
      .mockResponseOnce(JSON.stringify({ access_token: 'mock-token', token_type: 'Bearer' }))
      .mockResponseOnce(JSON.stringify(mockTrackResponse));

    const trackId = '3z8h0TU7ReDPLIbEnYhWZb';
    const track = await spotifyService.getTrackById(trackId);

    expect(track).toBeDefined();
    expect(track.id).toBe(trackId);
    expect(track.title).toBe('Bohemian Rhapsody');
    expect(track.artists).toBeDefined();
    expect(track.artists?.length).toBe(1);
    expect(track.artists?.[0].name).toBe('Queen');
    expect(track.release).toBeDefined();
    expect(track.release?.name).toBe('Bohemian Rhapsody (The Original Soundtrack)');
    expect(track.spotify_url).toBe('https://open.spotify.com/track/3z8h0TU7ReDPLIbEnYhWZb');
    expect(track.spotify_uri).toBe('spotify:track:3z8h0TU7ReDPLIbEnYhWZb');
    expect(track.duration).toBe(354947);
    expect(track.isrc).toBe('GBUM71029604');
    expect(track.type).toBe('track');
    expect(track.explicit).toBe(false);
    expect(track.popularity).toBe(72);
    expect(track.available_markets).toEqual(['US', 'GB']);
    expect(track.is_local).toBe(false);
  });
});
