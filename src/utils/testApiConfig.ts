/**
 * Test utility for API configuration
 * This file helps verify that the API configuration is working correctly
 */

import { getApiBaseUrl, getApiUrl } from './apiConfig';

/**
 * Test the API configuration by simulating different environments
 */
export const testApiConfig = (): void => {
  console.group('API Configuration Test');
  
  // Actual environment
  console.log('CURRENT ENVIRONMENT:');
  console.log('- API Base URL:', getApiBaseUrl());
  console.log('- Test API URL (releases):', getApiUrl('releases'));
  console.log('- Test API URL (api/artists):', getApiUrl('api/artists'));
  
  // Simulate production environment
  console.log('\nSIMULATED PRODUCTION:');
  
  // Save original location
  const originalLocation = window.location;
  
  // Mock window.location for vercel.app
  const mockVercel = () => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        ...originalLocation,
        hostname: 'builditrecords-git-main-ajsorbello.vercel.app',
        origin: 'https://builditrecords-git-main-ajsorbello.vercel.app'
      }
    });
  };
  
  // Mock window.location for builditrecords.com
  const mockProduction = () => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        ...originalLocation,
        hostname: 'builditrecords.com',
        origin: 'https://builditrecords.com'
      }
    });
  };
  
  // Test Vercel URLs
  try {
    mockVercel();
    console.log('Vercel deployment:');
    console.log('- API Base URL:', getApiBaseUrl());
    console.log('- Test API URL (releases):', getApiUrl('releases'));
  } catch (e) {
    console.error('Error testing Vercel config:', e);
  }
  
  // Test Production URLs
  try {
    mockProduction();
    console.log('Production deployment:');
    console.log('- API Base URL:', getApiBaseUrl());
    console.log('- Test API URL (releases):', getApiUrl('releases'));
  } catch (e) {
    console.error('Error testing Production config:', e);
  }
  
  // Restore original location
  Object.defineProperty(window, 'location', {
    writable: true,
    value: originalLocation
  });
  
  console.groupEnd();
};

// Export functions to make them available in the browser console
if (typeof window !== 'undefined') {
  (window as any).testApiConfig = testApiConfig;
  (window as any).getApiBaseUrl = getApiBaseUrl;
  (window as any).getApiUrl = getApiUrl;
}
