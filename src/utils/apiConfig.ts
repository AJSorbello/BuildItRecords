/**
 * API Configuration Utility
 * 
 * This module provides consistent API URL handling for different environments:
 * - Local development: Uses localhost:3000
 * - Production: Always uses the Render API URL (https://builditrecords.onrender.com/api)
 */

/**
 * Safely access environment variables without relying on import.meta directly
 * This is a simplified approach that avoids runtime errors during build
 */
const getEnv = (key: string): string | undefined => {
  // For browser environments, we can't directly access process.env
  // Instead, rely on the environment detection in getApiBaseUrl
  return undefined;
};

/**
 * Determines the base API URL depending on the current environment
 */
export const getApiBaseUrl = (): string => {
  // Default Render API URL for production environments
  const RENDER_API_URL = 'https://builditrecords.onrender.com/api';
  
  // For debugging - log detection information
  console.log('Environment detection:');
  
  // Check if we're running in a browser environment
  if (typeof window !== 'undefined') {
    console.log('- Window location:', window.location.origin);
    console.log('- Window hostname:', window.location.hostname);
    
    // For Vercel deployments or production domains, always use the Render API
    if (window.location.hostname.includes('vercel.app') || 
        window.location.hostname.includes('builditrecords')) {
      console.log('Production deployment detected - using Render API URL:', RENDER_API_URL);
      return RENDER_API_URL;
    }
    
    // For local development, use current origin
    const localApiUrl = `${window.location.origin}/api`;
    console.log('Using current origin for API URL:', localApiUrl);
    return localApiUrl;
  }
  
  // Default for any other environment (Node.js, etc.)
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
  
  // For full URLs (that might have been incorrectly passed), extract just the path
  if (cleanEndpoint.startsWith('http')) {
    console.log(`Warning: Found full URL in endpoint parameter: ${cleanEndpoint}`);
    try {
      const url = new URL(cleanEndpoint);
      // Extract just the pathname and search params
      const path = url.pathname.replace(/^\/api\//, '');
      const fullPath = path + url.search;
      console.log(`Converted to path: ${fullPath}`);
      return `${baseUrl}/${fullPath}`;
    } catch (e) {
      console.error(`[apiConfig] Error parsing URL: ${e}`);
    }
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
