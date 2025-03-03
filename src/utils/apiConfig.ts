/**
 * API Configuration Utility
 * 
 * This module provides consistent API URL handling for different environments:
 * - Local development: Uses localhost:3001
 * - Production (Vercel): Uses relative URLs that work with Vercel's API routing or the full API URL
 */

/**
 * Determines the base API URL depending on the current environment
 */
export const getApiBaseUrl = (): string => {
  // For debugging - log detection information
  if (typeof window !== 'undefined') {
    console.log('Environment detection:');
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    console.log('- REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
    console.log('- Window location:', window.location.origin);
    console.log('- Window hostname:', window.location.hostname);
    console.log('- Is production build:', process.env.NODE_ENV === 'production');
  }
  
  // Check for explicit API URL from environment
  if (process.env.REACT_APP_API_URL) {
    console.log('Using REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
    return process.env.REACT_APP_API_URL;
  }
  
  // In browser environment
  if (typeof window !== 'undefined') {
    // Production environment (including Vercel)
    if (process.env.NODE_ENV === 'production' || window.location.hostname.includes('vercel.app')) {
      console.log('Using production API URL with origin:', window.location.origin);
      return `${window.location.origin}/api`;
    }
  }
  
  // Default for development
  console.log('Using development API URL: http://localhost:3001/api');
  return 'http://localhost:3001/api';
};

/**
 * Constructs a complete API URL for a given endpoint
 */
export const getApiUrl = (endpoint: string): string => {
  const baseUrl = getApiBaseUrl();
  
  // Remove any leading slash from the endpoint to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  
  return `${baseUrl}/${cleanEndpoint}`;
};

/**
 * Helper function to make API requests with consistent error handling
 */
export const fetchApi = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  try {
    const url = getApiUrl(endpoint);
    console.log(`Making API request to: ${url}`);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error (${response.status}): ${errorText}`);
      throw new Error(`API Error (${response.status}): ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
};
