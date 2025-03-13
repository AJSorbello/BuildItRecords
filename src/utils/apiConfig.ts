/**
 * API Configuration Utility
 * 
 * This module provides consistent API URL handling for different environments:
 * - Local development: Uses localhost:3001/api
 * - Production: Always uses the Render API URL (https://builditrecords-api.onrender.com/api)
 */

/**
 * Determines the base API URL depending on the current environment
 */
export const getApiBaseUrl = (): string => {
  // For debugging - log detection information
  if (typeof window !== 'undefined') {
    console.log('Environment detection:');
    console.log('- MODE:', import.meta.env.MODE);
    console.log('- VITE_API_URL:', import.meta.env.VITE_API_URL);
    console.log('- Window location:', window.location.origin);
    console.log('- Window hostname:', window.location.hostname);
    console.log('- Is production build:', import.meta.env.MODE === 'production');
  }
  
  // Check for explicit API URL from environment
  if (import.meta.env.VITE_API_URL) {
    console.log('Using VITE_API_URL:', import.meta.env.VITE_API_URL);
    
    // If it's a relative URL and we're in a browser context, prefix with origin
    if (import.meta.env.VITE_API_URL.startsWith('/') && typeof window !== 'undefined') {
      const fullUrl = `${window.location.origin}${import.meta.env.VITE_API_URL}`;
      console.log('Expanded relative URL to:', fullUrl);
      return fullUrl;
    }
    
    return import.meta.env.VITE_API_URL;
  }
  
  // In browser environment
  if (typeof window !== 'undefined') {
    // Production environment (including Render)
    if (import.meta.env.MODE === 'production' || 
        window.location.hostname.includes('render.com') || 
        window.location.hostname.includes('builditrecords.com')) {
      // ALWAYS use the Render API URL for production
      const renderApiUrl = 'https://builditrecords-api.onrender.com/api';
      console.log('Using Render API URL:', renderApiUrl);
      return renderApiUrl;
    }
  }
  
  // Default for development
  console.log('Using development API URL: http://localhost:3001/api');
  return 'http://localhost:3001/api';
};

/**
 * Constructs a full API URL by joining the base URL with an endpoint
 * @param endpoint - API endpoint path (without leading slash)
 * @returns Complete API URL
 */
export const getApiUrl = (endpoint: string): string => {
  const baseUrl = getApiBaseUrl();
  
  // Ensure endpoint doesn't start with a slash and baseUrl doesn't end with one
  // to prevent double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  
  // Check if the base URL already has the /api suffix
  if (baseUrl.endsWith('/api')) {
    return `${baseUrl}/${cleanEndpoint}`;
  } else {
    return `${baseUrl}/api/${cleanEndpoint}`;
  }
};

/**
 * Helper function to make GET requests to the API
 * @param endpoint - API endpoint to fetch from
 * @returns Response data
 */
export const fetchFromApi = async <T>(endpoint: string): Promise<T> => {
  const url = getApiUrl(endpoint);
  
  // Debug logging
  console.log('[DEBUG] Environment:', import.meta.env.MODE);
  console.log('[DEBUG] API Base URL:', getApiBaseUrl());
  console.log('[DEBUG] Full API URL:', url);
  console.log('[DEBUG] Sending GET request to', url);
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    return data as T;
  } catch (error) {
    console.error('[API Error]', error);
    throw error;
  }
};
