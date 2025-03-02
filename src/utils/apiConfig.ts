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
  // Check for explicit API URL from environment
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // In Vercel production environment
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    // Check for window.origin to help with debugging
    console.log('Current origin:', window.location.origin);
    
    // Determine if we're running on Vercel by checking the hostname
    const isVercel = window.location.hostname.includes('vercel.app');
    
    if (isVercel) {
      // For Vercel deployments, we know the API is configured through routes in vercel.json
      return `${window.location.origin}/api`;
    }
    
    // For other production environments, use relative URL
    return '/api';
  }
  
  // Default for development
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
