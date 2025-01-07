import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

class AdminService {
  constructor() {
    this.api = axios.create({
      baseURL: `${API_URL}/admin`,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add request interceptor to add token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  async login(username, password) {
    try {
      const response = await this.api.post('/login', { username, password });
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async verifyToken() {
    try {
      const response = await this.api.get('/verify');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async importReleases(labelId) {
    try {
      const response = await this.api.get(`/import-releases/${labelId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getImportLogs() {
    try {
      const response = await this.api.get('/import-logs');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  handleError(error) {
    if (error.response) {
      // Server responded with error
      return {
        status: error.response.status,
        message: error.response.data.message || 'An error occurred',
        details: error.response.data.details
      };
    } else if (error.request) {
      // Request made but no response
      return {
        status: 503,
        message: 'Server is not responding',
        details: 'Please try again later'
      };
    } else {
      // Error setting up request
      return {
        status: 500,
        message: 'Request failed',
        details: error.message
      };
    }
  }

  logout() {
    localStorage.removeItem('token');
  }
}

export default new AdminService();
