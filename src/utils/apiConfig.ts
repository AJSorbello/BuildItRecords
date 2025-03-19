/**
 * API Configuration Utility
 * 
 * This module provides consistent API URL handling for different environments:
 * - Local development: Uses localhost:3000
 * - Production: Always uses the Render API URL (https://builditrecords.onrender.com/api)
 */

/**
 * Safely access environment variables to avoid "process is not defined" errors
 */
const getEnv = (key: string): string | undefined => {
  try {
    // For Vite, use import.meta.env
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      return import.meta.env[key];
    }
    
    // Traditional Node.js env access (fallback)
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
    
    return undefined;
  } catch (e) {
    console.warn(`Error accessing env var ${key}:`, e);
    return undefined;
  }
};

/**
 * Determines the base API URL depending on the current environment
 */
export const getApiBaseUrl = (): string => {
  // Default Render API URL
  const RENDER_API_URL = 'https://builditrecords.onrender.com/api';
  
  // For debugging - log detection information
  console.log('Environment detection:');
  try {
    console.log('- NODE_ENV:', getEnv('NODE_ENV'));
    console.log('- VITE_API_URL:', import.meta?.env?.VITE_API_URL);
    console.log('- import.meta.env:', import.meta?.env);
  } catch (e) {
    console.log('- Error accessing env vars:', e);
  }
  
  if (typeof window !== 'undefined') {
    console.log('- Window location:', window.location.origin);
    console.log('- Window hostname:', window.location.hostname);
  }
  
  // For Vercel deployments or production, use the Render API
  if (typeof window !== 'undefined' && 
      (window.location.hostname.includes('vercel.app') || 
       window.location.hostname.includes('builditrecords'))) {
    console.log('Production deployment detected - using Render API URL:', RENDER_API_URL);
    return RENDER_API_URL;
  }
  
  // Check for explicit API URL from Vite environment
  try {
    const viteApiUrl = import.meta?.env?.VITE_API_URL;
    if (viteApiUrl && typeof viteApiUrl === 'string' && viteApiUrl.length > 0) {
      console.log('Using VITE_API_URL:', viteApiUrl);
      return viteApiUrl;
    }
  } catch (e) {
    console.warn('Error accessing Vite env vars:', e);
  }
  
  // For local development, use current origin or fallback to localhost:3000
  if (typeof window !== 'undefined') {
    // Use the current origin so it automatically adapts to any port
    const localApiUrl = `${window.location.origin}/api`;
    console.log('Using current origin for API URL:', localApiUrl);
    return localApiUrl;
  }
  
  // Default for development
  const defaultUrl = 'http://localhost:3000/api';
  console.log('Using default development API URL:', defaultUrl);
  return defaultUrl;
};

/**
 * Constructs a complete API URL for a given endpoint
 */
export const getApiUrl = (endpoint: string): string => {
  const baseUrl = getApiBaseUrl();
  
  // Remove any leading slash from the endpoint to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  
  // Ensure baseUrl is not empty
  if (!baseUrl || baseUrl === '') {
    console.warn('API base URL is empty! Falling back to localhost:3000');
    return `http://localhost:3000/${cleanEndpoint}`;
  }
  
  // Check if baseUrl already includes /api to avoid duplication
  if (baseUrl.endsWith('/api')) {
    const apiPath = cleanEndpoint.startsWith('api/') ? cleanEndpoint.substring(4) : cleanEndpoint;
    const url = `${baseUrl}/${apiPath}`;
    console.log(`URL construction: ${url}`);
    return url;
  }
  
  const url = `${baseUrl}/${cleanEndpoint}`;
  console.log(`URL construction: ${url}`);
  return url;
};

/**
 * Helper function to make API requests with consistent error handling
 */
export const fetchApi = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  const url = getApiUrl(endpoint);
  
  // Debug logging
  console.log('[DEBUG] Full API URL:', url);
  console.log('[DEBUG] Sending request to', url, 'with method', options.method || 'GET');
  
  try {
    // For local development, handle CORS properly
    const fetchOptions = {
      ...options,
      headers: {
        ...options.headers,
        'Accept': 'application/json'
      },
    };
    
    const response = await fetch(url, fetchOptions);
    console.log('[DEBUG] Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      console.log('API Error:', response.status, '-', response.statusText);
      let errorDetail = '';
      
      try {
        const errorData = await response.json();
        errorDetail = errorData.message || JSON.stringify(errorData);
      } catch (e) {
        console.log('Could not parse error response as JSON');
        // Try to get the text content
        try {
          errorDetail = await response.text();
          // Only show first 100 chars to avoid huge error messages
          errorDetail = errorDetail.substring(0, 100) + (errorDetail.length > 100 ? '...' : '');
        } catch (textError) {
          errorDetail = 'Could not extract error details';
        }
      }
      
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    // For successful responses, if JSON fails try to return text content
    try {
      return await response.json();
    } catch (jsonError) {
      console.warn('Response is not valid JSON, returning text instead');
      return { success: false, message: 'Invalid JSON response', text: await response.text() };
    }
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};
