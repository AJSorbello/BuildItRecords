import { useState, useEffect } from 'react';

// Replace React Native AsyncStorage with localStorage
const storage = {
  getItem: async (key: string) => {
    return localStorage.getItem(key);
  },
  setItem: async (key: string, value: string) => {
    localStorage.setItem(key, value);
  },
  removeItem: async (key: string) => {
    localStorage.removeItem(key);
  }
};

export const useSpotifyFollow = (labelId: string) => {
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    // Load follow state on mount
    loadFollowState();
  }, []);

  const loadFollowState = async () => {
    try {
      const followState = await storage.getItem(`spotify_follow_${labelId}`);
      setIsFollowing(followState === 'true');
    } catch (error) {
      console.error('Error loading follow state:', error);
    }
  };

  const handleFollow = async () => {
    try {
      await storage.setItem(`spotify_follow_${labelId}`, 'true');
      setIsFollowing(true);
    } catch (error) {
      console.error('Error saving follow state:', error);
    }
  };

  return { isFollowing, handleFollow };
};
