/**
 * API Configuration Utility
 * 
 * This module provides consistent API URL handling for different environments:
 * - Local development: Uses localhost:3003
 * - Production: Always uses the Render API URL (https://builditrecords.onrender.com/api)
 */

/**
 * Determines the base API URL depending on the current environment
 */
export const getApiBaseUrl = (): string => {
  const RENDER_API_URL = 'https://builditrecords.onrender.com/api';
  
  // For debugging - log detection information
  if (typeof window !== 'undefined') {
    console.log('Environment detection:');
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    console.log('- REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
    console.log('- Window location:', window.location.origin);
    console.log('- Window hostname:', window.location.hostname);
    console.log('- Is production build:', process.env.NODE_ENV === 'production');
    console.log('- Will use Render API URL:', RENDER_API_URL);
  }
  
  // For Vercel deployments, ALWAYS use the Render API
  if (typeof window !== 'undefined' && 
      (window.location.hostname.includes('vercel.app') || 
       window.location.hostname.includes('builditrecords'))) {
    console.log('Vercel deployment detected - using Render API URL:', RENDER_API_URL);
    return RENDER_API_URL;
  }
  
  // Check for explicit API URL from environment
  if (process.env.REACT_APP_API_URL) {
    console.log('Using REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
    
    // If it's a relative URL and we're in a browser context, prefix with origin
    if (process.env.REACT_APP_API_URL.startsWith('/') && typeof window !== 'undefined') {
      const fullUrl = `${window.location.origin}${process.env.REACT_APP_API_URL}`;
      console.log('Expanded relative URL to:', fullUrl);
      return fullUrl;
    }
    
    return process.env.REACT_APP_API_URL;
  }
  
  // In browser environment
  if (typeof window !== 'undefined') {
    // Production environment (including Vercel)
    if (process.env.NODE_ENV === 'production' || 
        window.location.hostname.includes('vercel.app') || 
        window.location.hostname.includes('builditrecords')) {
      // ALWAYS use the Render API URL for production
      console.log('Production environment detected - using Render API URL:', RENDER_API_URL);
      return RENDER_API_URL;
    }
  }
  
  // Default for development
  console.log('Using development API URL: http://localhost:3003/api');
  return 'http://localhost:3003/api';
};

/**
 * Constructs a complete API URL for a given endpoint
 */
export const getApiUrl = (endpoint: string): string => {
  const baseUrl = getApiBaseUrl();
  
  // Remove any leading slash from the endpoint to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  
  // Check if baseUrl already includes /api to avoid duplication
  if (baseUrl.endsWith('/api')) {
    const apiPath = cleanEndpoint.startsWith('api/') ? cleanEndpoint.substring(4) : cleanEndpoint;
    console.log(`URL construction: ${baseUrl}/${apiPath}`);
    return `${baseUrl}/${apiPath}`;
  }
  
  return `${baseUrl}/${cleanEndpoint}`;
};

/**
 * Helper function to make API requests with consistent error handling
 */
export const fetchApi = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  const url = getApiUrl(endpoint);
  
  // Debug logging
  console.log('[DEBUG] Environment:', process.env.NODE_ENV);
  console.log('[DEBUG] API Base URL:', getApiBaseUrl());
  console.log('[DEBUG] Full API URL:', url);
  console.log('[DEBUG] Sending GET request to', url);
  
  try {
    const response = await fetch(url, options);
    console.log('[DEBUG] Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      console.log('API Error:', response.status, '-', response.statusText);
      let errorDetail = '';
      
      try {
        const errorData = await response.json();
        errorDetail = errorData.message || JSON.stringify(errorData);
      } catch (e) {
        console.log('Could not parse error response as JSON');
      }
      
      throw new Error(`API Error ${response.status}: ${errorDetail}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};
