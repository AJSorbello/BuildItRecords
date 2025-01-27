export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class DatabaseError extends Error {
  constructor(
    public message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class SpotifyError extends Error {
  constructor(
    public message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'SpotifyError';
  }
}

export class AuthError extends Error {
  constructor(
    public message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export class ValidationError extends Error {
  constructor(
    public message: string,
    public field?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function isApiError(error: any): error is ApiError {
  return error instanceof ApiError;
}

export function isDatabaseError(error: any): error is DatabaseError {
  return error instanceof DatabaseError;
}

export function isSpotifyError(error: any): error is SpotifyError {
  return error instanceof SpotifyError;
}

export function isAuthError(error: any): error is AuthError {
  return error instanceof AuthError;
}

export function isValidationError(error: any): error is ValidationError {
  return error instanceof ValidationError;
}

export function handleApiError(error: any): ApiError {
  if (isApiError(error)) {
    return error;
  }
  
  if (isDatabaseError(error)) {
    return new ApiError(500, error.message, 'DATABASE_ERROR', error.details);
  }
  
  if (isSpotifyError(error)) {
    return new ApiError(502, error.message, 'SPOTIFY_ERROR', error.details);
  }
  
  if (isAuthError(error)) {
    return new ApiError(401, error.message, 'AUTH_ERROR', error.details);
  }
  
  if (isValidationError(error)) {
    return new ApiError(400, error.message, 'VALIDATION_ERROR', error.details);
  }
  
  // Handle unknown errors
  console.error('Unknown error:', error);
  return new ApiError(500, 'An unexpected error occurred', 'UNKNOWN_ERROR', error);
}

export function formatErrorMessage(error: Error): string {
  if (error instanceof ValidationError) {
    return `Validation error: ${error.message}${error.field ? ` (${error.field})` : ''}`;
  }
  
  if (error instanceof ApiError) {
    return `API error (${error.status}): ${error.message}`;
  }
  
  if (error instanceof DatabaseError) {
    return `Database error: ${error.message}`;
  }
  
  if (error instanceof SpotifyError) {
    return `Spotify error: ${error.message}`;
  }
  
  if (error instanceof AuthError) {
    return `Authentication error: ${error.message}`;
  }
  
  return error.message || 'An unknown error occurred';
}

export function logError(error: Error, context?: any): void {
  const timestamp = new Date().toISOString();
  const errorType = error.constructor.name;
  const errorMessage = formatErrorMessage(error);
  
  console.error({
    timestamp,
    type: errorType,
    message: errorMessage,
    context,
    stack: error.stack
  });
}
