/**
 * monitoredFetch.ts
 * A fetch wrapper that integrates with the monitoring service and provides better error handling
 */

import { monitoringService } from '../services/MonitoringService';

// Error types for better categorization
export enum FetchErrorType {
  NETWORK = 'network',
  CORS = 'cors',
  SERVER = 'server',
  TIMEOUT = 'timeout',
  PARSE = 'parse',
  AUTH = 'authentication',
  UNKNOWN = 'unknown'
}

// Enhanced error class with additional properties
export class EnhancedFetchError extends Error {
  public type: FetchErrorType;
  public statusCode?: number;
  public responseBody?: any;
  public url: string;
  public requestDetails?: any;
  
  constructor(
    message: string, 
    type: FetchErrorType = FetchErrorType.UNKNOWN, 
    url: string,
    statusCode?: number,
    responseBody?: any,
    requestDetails?: any
  ) {
    super(message);
    this.name = 'EnhancedFetchError';
    this.type = type;
    this.url = url;
    this.statusCode = statusCode;
    this.responseBody = responseBody;
    this.requestDetails = requestDetails;
  }
}

// Options for the monitored fetch
export interface MonitoredFetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  service?: 'vercel' | 'render' | 'database';
}

/**
 * A fetch wrapper that integrates with the monitoring service
 * @param url URL to fetch
 * @param options Options for the fetch request
 * @returns Promise resolving to the JSON response
 */
export async function monitoredFetch<T>(url: string, options: MonitoredFetchOptions = {}): Promise<T> {
  const {
    timeout = 30000, // 30 seconds default timeout
    retries = 1,
    retryDelay = 1000,
    service,
    ...fetchOptions
  } = options;

  let attempt = 0;
  let lastError: EnhancedFetchError;

  while (attempt <= retries) {
    try {
      // Create an AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      // Add signal to fetch options
      const fetchOpts = {
        ...fetchOptions,
        signal: controller.signal
      };
      
      // Attempt the fetch
      const response = await fetch(url, fetchOpts);
      
      // Clear the timeout
      clearTimeout(timeoutId);
      
      // Handle response status
      if (!response.ok) {
        let errorBody;
        try {
          // Try to parse the error response
          errorBody = await response.json();
        } catch {
          // If parsing fails, use empty object
          errorBody = {};
        }
        
        // Determine error type based on status code
        let errorType = FetchErrorType.SERVER;
        if (response.status === 401 || response.status === 403) {
          errorType = FetchErrorType.AUTH;
        }
        
        // Record the error in monitoring service
        updateMonitoringService(
          service, 
          'unhealthy', 
          `Server error: ${response.status} ${response.statusText}`,
          { 
            statusCode: response.status, 
            url,
            errorBody
          }
        );
        
        // Throw enhanced error
        throw new EnhancedFetchError(
          `Server error: ${response.status} ${response.statusText}`,
          errorType,
          url,
          response.status,
          errorBody,
          { method: fetchOptions.method || 'GET' }
        );
      }
      
      // Try to parse response as JSON
      try {
        const data = await response.json();
        
        // Record successful request in monitoring service
        if (service) {
          updateMonitoringService(
            service, 
            'healthy', 
            'API request succeeded'
          );
        }
        
        return data as T;
      } catch (error) {
        // JSON parse error
        updateMonitoringService(
          service, 
          'degraded', 
          'Response parsing error', 
          { error: error instanceof Error ? error.message : String(error) }
        );
        
        throw new EnhancedFetchError(
          'Failed to parse response as JSON',
          FetchErrorType.PARSE,
          url,
          response.status,
          undefined,
          { method: fetchOptions.method || 'GET' }
        );
      }
    } catch (error) {
      // Handle different error types
      if (error instanceof EnhancedFetchError) {
        // Re-throw our enhanced error
        lastError = error;
      } else if (error instanceof DOMException && error.name === 'AbortError') {
        // Timeout error
        lastError = new EnhancedFetchError(
          'Request timed out',
          FetchErrorType.TIMEOUT,
          url,
          undefined,
          undefined,
          { timeout, method: fetchOptions.method || 'GET' }
        );
        
        updateMonitoringService(
          service, 
          'unhealthy', 
          'Request timed out', 
          { timeout, url }
        );
      } else {
        // Determine if it's a CORS error
        const errorMessage = error instanceof Error ? error.message : String(error);
        const isCorsError = 
          errorMessage.includes('CORS') || 
          errorMessage.includes('cross-origin') || 
          errorMessage.includes('Access-Control-Allow-Origin');
        
        lastError = new EnhancedFetchError(
          errorMessage,
          isCorsError ? FetchErrorType.CORS : FetchErrorType.NETWORK,
          url,
          undefined,
          undefined,
          { method: fetchOptions.method || 'GET' }
        );
        
        updateMonitoringService(
          service, 
          'unhealthy', 
          isCorsError ? 'CORS error: cross-origin request blocked' : 'Network error', 
          { 
            error: errorMessage,
            url,
            isCorsError
          }
        );
      }
      
      // Check if we should retry
      if (attempt < retries) {
        attempt++;
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        console.log(`Retrying fetch (${attempt}/${retries}): ${url}`);
      } else {
        // No more retries, throw the last error
        throw lastError;
      }
    }
  }
  
  // This should never be reached due to throw in the loop
  throw new Error('Unexpected error in monitoredFetch');
}

/**
 * Helper function to update the monitoring service
 */
function updateMonitoringService(
  service?: 'vercel' | 'render' | 'database',
  status?: 'healthy' | 'unhealthy' | 'degraded' | 'unknown',
  message?: string,
  details?: Record<string, any>
) {
  if (!service || !status) return;
  
  // Import dynamically to avoid circular dependencies
  import('../services/MonitoringService').then(({ monitoringService }) => {
    monitoringService.updateServiceHealth(service, {
      status,
      message: message || `API ${status === 'healthy' ? 'is healthy' : 'has issues'}`,
      timestamp: new Date().toISOString(),
      ...(status === 'healthy' ? { lastSuccessful: new Date().toISOString() } : {}),
      ...(details ? { details } : {})
    });
  }).catch(err => console.error('Failed to update monitoring service:', err));
}
