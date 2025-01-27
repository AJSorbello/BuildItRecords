import { API_URL } from '../config';

// Function to clear local storage data
export const clearData = () => {
  // Keep authentication data
  const adminToken = localStorage.getItem('adminToken');
  const selectedLabel = localStorage.getItem('selectedLabel');
  
  // Clear all data
  localStorage.clear();
  
  // Restore authentication data
  if (adminToken) localStorage.setItem('adminToken', adminToken);
  if (selectedLabel) localStorage.setItem('selectedLabel', selectedLabel);
};

// Function to refresh data from database
export const refreshCache = async () => {
  try {
    // Clear local data
    clearData();

    // Call the server's database warmup endpoint
    const response = await fetch(`${API_URL}/postgres/warmup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to refresh data');
    }

    return true;
  } catch (error) {
    console.error('Error refreshing data:', error);
    return false;
  }
};
