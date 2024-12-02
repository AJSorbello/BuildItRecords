import { Track } from '../types/track';
import { RECORD_LABELS, RecordLabel } from '../constants/labels';

export interface Artist {
  id: string;
  name: string;
  bio: string;
  spotifyUrl: string;
  beatportUrl: string;
  soundcloudUrl: string;
  recordLabel: RecordLabel;
  imageUrl?: string;
}

export const mockArtists: Artist[] = [
  {
    id: '1',
    name: 'DJ Deep',
    bio: 'Deep house and techno producer from London',
    spotifyUrl: 'https://open.spotify.com/artist/123',
    beatportUrl: 'https://www.beatport.com/artist/dj-deep/123',
    soundcloudUrl: 'https://soundcloud.com/djdeep',
    recordLabel: RECORD_LABELS.RECORDS,
    imageUrl: 'https://via.placeholder.com/300x300.png?text=DJ+Deep'
  },
  {
    id: '2',
    name: 'Tech Master',
    bio: 'Tech house innovator from Berlin',
    spotifyUrl: 'https://open.spotify.com/artist/456',
    beatportUrl: 'https://www.beatport.com/artist/tech-master/456',
    soundcloudUrl: 'https://soundcloud.com/techmaster',
    recordLabel: RECORD_LABELS.TECH,
    imageUrl: 'https://via.placeholder.com/300x300.png?text=Tech+Master'
  },
  {
    id: '3',
    name: 'Bass Explorer',
    bio: 'Deep bass music producer from Detroit',
    spotifyUrl: 'https://open.spotify.com/artist/789',
    beatportUrl: 'https://www.beatport.com/artist/bass-explorer/789',
    soundcloudUrl: 'https://soundcloud.com/bassexplorer',
    recordLabel: RECORD_LABELS.DEEP,
    imageUrl: 'https://via.placeholder.com/300x300.png?text=Bass+Explorer'
  }
];

export const mockTracks: Track[] = [
  {
    id: '1',
    trackTitle: 'Deep House Vibes',
    artist: 'DJ Deep',
    spotifyUrl: 'https://open.spotify.com/track/123456',
    recordLabel: RECORD_LABELS.RECORDS
  },
  {
    id: '2',
    trackTitle: 'Tech House Groove',
    artist: 'Tech Master',
    spotifyUrl: 'https://open.spotify.com/track/234567',
    recordLabel: RECORD_LABELS.TECH
  },
  {
    id: '3',
    trackTitle: 'Deep Bass Journey',
    artist: 'Bass Explorer',
    spotifyUrl: 'https://open.spotify.com/track/345678',
    recordLabel: RECORD_LABELS.DEEP
  },
  {
    id: '4',
    trackTitle: 'House Nation',
    artist: 'DJ Deep',
    spotifyUrl: 'https://open.spotify.com/track/456789',
    recordLabel: RECORD_LABELS.RECORDS
  }
];

export const initializeMockData = () => {
  // Initialize tracks in localStorage if they don't exist
  if (!localStorage.getItem('tracks')) {
    localStorage.setItem('tracks', JSON.stringify(mockTracks));
  }
  
  // Initialize artists in localStorage if they don't exist
  if (!localStorage.getItem('artists')) {
    localStorage.setItem('artists', JSON.stringify(mockArtists));
  }
};
