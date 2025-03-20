/**
 * API response type definitions for the BuildItRecords app
 */

// Basic API response structure
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  // Extended fields for paginated responses
  releases?: any[];
  artists?: any[];
  tracks?: any[];
  total?: number;
  count?: number;
  // Add other properties that are accessed in the code
  details?: any;
}

// Extended API response with additional metadata
export interface ApiResponseExtended<T = any> extends ApiResponse<T> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  metadata?: {
    count: number;
    lastUpdated: string;
  };
}

// Extended Artist type with labels
export interface Artist {
  id: string;
  name: string;
  // Other properties
  labels?: string[];
}

// Extended Release type
export interface ExtendedRelease {
  id: string;
  title: string;
  artist: string;
  // Other properties
}

// Import response
export interface ImportResponse {
  imported: number;
  skipped: number;
  errors: any[];
  details?: {
    [key: string]: any;
  };
}

// Track type
export interface Track {
  id: string;
  title: string;
  duration: number;
  // Other properties
}

// Declare the module to augment existing types
declare module '*.ts' {
  interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data: T;
    releases?: any[];
    artists?: any[];
    tracks?: any[];
    total?: number;
    count?: number;
    details?: any;
  }
}

export {};
