import { API_URL } from '../config';

export interface ImportLog {
  id: number;
  type: 'artist' | 'release' | 'track';
  spotifyId: string;
  status: 'success' | 'error';
  error: string | null;
  importedAt: string;
}

export interface ImportStats {
  type: string;
  status: string;
  count: number;
}

export interface ImportResponse {
  logs: ImportLog[];
  stats: ImportStats[];
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export const getImportLogs = async (
  token: string,
  params: {
    type?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }
): Promise<ImportResponse> => {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) queryParams.append(key, value.toString());
  });

  const response = await fetch(`${API_URL}/admin/imports?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch import logs');
  }

  return response.json();
};

export const startImport = async (token: string, labelId: string): Promise<void> => {
  const response = await fetch(`${API_URL}/admin/imports/${labelId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to start import');
  }
};

export const getImportDetails = async (
  token: string,
  type: string,
  spotifyId: string
): Promise<ImportLog[]> => {
  const response = await fetch(`${API_URL}/admin/imports/${type}/${spotifyId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch import details');
  }

  return response.json();
};

export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  const response = await fetch(`${API_URL}/admin/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    throw new Error('Invalid credentials');
  }

  return response.json();
};
