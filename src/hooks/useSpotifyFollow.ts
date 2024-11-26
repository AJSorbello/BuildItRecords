import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useSpotifyFollow = (labelId: string) => {
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    // Load follow state on mount
    loadFollowState();
  }, []);

  const loadFollowState = async () => {
    try {
      const followState = await AsyncStorage.getItem(`spotify_follow_${labelId}`);
      setIsFollowing(followState === 'true');
    } catch (error) {
      console.error('Error loading follow state:', error);
    }
  };

  const handleFollow = async () => {
    try {
      await AsyncStorage.setItem(`spotify_follow_${labelId}`, 'true');
      setIsFollowing(true);
    } catch (error) {
      console.error('Error saving follow state:', error);
    }
  };

  return { isFollowing, handleFollow };
};
