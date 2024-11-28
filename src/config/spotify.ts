// Spotify Configuration
export const SPOTIFY_CONFIG = {
  // Main Label Playlists
  PLAYLISTS: {
    // Build It Records main playlist
    records: {
      id: '4nLXxzxWZYqjpQYqDONNvg', // Replace with your actual Records playlist ID
      title: 'Build It Records',
      description: 'Official Build It Records playlist featuring the latest releases and catalog tracks',
    },
    // Build It Tech playlist
    tech: {
      id: '6MwPCCR936oveN7EXpYGZB', // Replace with your actual Tech playlist ID
      title: 'Build It Tech',
      description: 'Official Build It Tech playlist featuring cutting-edge techno and tech house',
    },
    // Build It Deep playlist
    deep: {
      id: '2YRe7HRKNRvXdJBp9nXFza', // Replace with your actual Deep playlist ID
      title: 'Build It Deep',
      description: 'Official Build It Deep playlist featuring deep and melodic house music',
    }
  },
  
  // External URLs
  URLS: {
    records: {
      spotify: 'https://open.spotify.com/playlist/4nLXxzxWZYqjpQYqDONNvg',
      beatport: 'https://www.beatport.com/label/build-it-records/89999',
      soundcloud: 'https://soundcloud.com/builditrecords'
    },
    tech: {
      spotify: 'https://open.spotify.com/playlist/6MwPCCR936oveN7EXpYGZB',
      beatport: 'https://www.beatport.com/label/build-it-tech/90000',
      soundcloud: 'https://soundcloud.com/buildittech'
    },
    deep: {
      spotify: 'https://open.spotify.com/playlist/2YRe7HRKNRvXdJBp9nXFza',
      beatport: 'https://www.beatport.com/label/build-it-deep/90001',
      soundcloud: 'https://soundcloud.com/builditdeep'
    }
  }
} as const;
