import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Only add token if we're in the browser
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        // Clear auth data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Only redirect if not already on login page
        if (window.location.pathname !== '/') {
          window.location.href = '/';
        }
      }
    }
    
    // Return a more user-friendly error message
    const errorMessage = error.response?.data?.error || 
                        error.message || 
                        'Something went wrong. Please try again.';
    
    return Promise.reject(errorMessage);
  }
);

// Authentication endpoints
export const auth = {
  register: (data) => api.post('/api/register', data),
  login: (data) => api.post('/api/login', data),
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
  }
};

// Profile endpoints
export const profiles = {
  // Get profiles to swipe on
  getQueue: () => api.get('/api/profiles'),
  
  // CRITICAL FIX: Get own profile with photos
  getMyProfile: () => api.get('/api/profile'),
  
  // Swipe on a profile
  swipe: (targetId, direction) => {
    if (!targetId || !direction) {
      return Promise.reject('Invalid swipe parameters');
    }
    return api.post('/api/swipe', { targetId, direction });
  },
  
  // Update profile information
  updateProfile: (data) => api.put('/api/profile', data),
  
  // Upload a photo
  uploadPhoto: (file) => {
    if (!file) {
      return Promise.reject('No file provided');
    }
    
    const formData = new FormData();
    formData.append('photo', file);
    
    return api.post('/api/upload', formData, {
      headers: { 
        'Content-Type': 'multipart/form-data' 
      },
      // Longer timeout for file uploads
      timeout: 60000
    });
  }
};

// Matches endpoints
export const matches = {
  // Get all matches
  getAll: () => api.get('/api/matches')
};

// Health check
export const health = {
  check: () => api.get('/health')
};

export default api;