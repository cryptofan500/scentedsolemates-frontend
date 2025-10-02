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
        // FIX: Redirect to root (/) where login page is, but avoid redirect loop
        if (window.location.pathname !== '/') {
          window.location.href = '/';
        }
      }
    }
    
    // Handle 403 Forbidden (account not verified)
    if (error.response?.status === 403) {
      const errorMessage = error.response.data?.error || 'Account not verified or suspended';
      if (typeof window !== 'undefined' && errorMessage.includes('manual approval')) {
        // Don't redirect, just show the message
        return Promise.reject(errorMessage);
      }
    }
    
    // Handle 429 Rate Limiting
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'] || 60;
      const errorMessage = `Too many requests. Please wait ${retryAfter} seconds and try again.`;
      
      if (typeof window !== 'undefined') {
        alert(errorMessage);
      }
      
      return Promise.reject(errorMessage);
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
  
  // Get profiles with mode filtering (disabled for MVP)
  getQueueWithMode: async (filterMode = null) => {
    try {
      const response = await api.get('/api/profiles');
      let profiles = response.data;
      
      // Client-side mode filtering if specified (disabled for MVP)
      if (filterMode && ['tease_toes', 'apocalypse_ankles'].includes(filterMode)) {
        profiles = profiles.filter(p => p.mode === filterMode);
      }
      
      return profiles;
    } catch (err) {
      console.error('Failed to fetch profiles:', err);
      return [];
    }
  },
  
  // Get own profile with photos
  getMyProfile: () => api.get('/api/profile'),
  
  // Check if user can swipe (has photos)
  canSwipe: () => api.get('/api/can-swipe'),
  
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
    
    // FIX: Removed 'Content-Type' header - browser sets it automatically with correct boundary
    return api.post('/api/upload', formData, {
      // Longer timeout for file uploads
      timeout: 60000
    });
  },
  
  // Upload photo with type
  uploadTypedPhoto: (file, photoType) => {
    if (!file) {
      return Promise.reject('No file provided');
    }
    
    const validTypes = ['profile', 'verification', 'face', 'feet', 'socks', 'shoes', 'pedicure'];
    if (photoType && !validTypes.includes(photoType)) {
      return Promise.reject('Invalid photo type');
    }
    
    const formData = new FormData();
    formData.append('photo', file);
    if (photoType) {
      formData.append('photo_type', photoType);
    }
    
    // FIX: Removed 'Content-Type' header - browser sets it automatically with correct boundary
    return api.post('/api/upload', formData, {
      timeout: 60000
    });
  }
};

// Matches endpoints
export const matches = {
  // Get all matches
  getAll: () => api.get('/api/matches'),
  
  // Unmatch someone
  unmatch: (matchId) => {
    if (!matchId) {
      return Promise.reject('Match ID required');
    }
    return api.delete(`/api/matches/${matchId}`);
  }
};

// Messages endpoints
export const messages = {
  // Send a message
  send: (matchId, content) => {
    if (!matchId || !content) {
      return Promise.reject('Match ID and content required');
    }
    if (content.length > 5000) {
      return Promise.reject('Message too long (max 5000 characters)');
    }
    return api.post('/api/messages', { matchId, content });
  },
  
  // Get messages for a match
  getConversation: (matchId) => {
    if (!matchId) {
      return Promise.reject('Match ID required');
    }
    return api.get(`/api/messages/${matchId}`);
  }
};

// Security endpoints
export const security = {
  // Block a user
  block: (userId) => {
    if (!userId) {
      return Promise.reject('User ID required');
    }
    return api.post('/api/block', { targetId: userId });
  },
  
  // Report a user
  report: (userId, reason, details = '') => {
    if (!userId || !reason) {
      return Promise.reject('User ID and reason required');
    }
    const validReasons = ['spam', 'fake', 'inappropriate', 'other'];
    if (!validReasons.includes(reason)) {
      return Promise.reject('Invalid report reason');
    }
    return api.post('/api/report', { targetId: userId, reason, details });
  },
  
  // Unblock a user (future feature)
  unblock: (userId) => {
    if (!userId) {
      return Promise.reject('User ID required');
    }
    return api.delete(`/api/unblock/${userId}`);
  },
  
  // Get blocked users (future feature)
  getBlocked: () => api.get('/api/blocked-users')
};

// Mode management (keeping for compatibility but disabled in UI)
export const modes = {
  // Get current mode
  getCurrent: async () => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        return user.mode || 'tease_toes';
      }
      // Fallback to fetching from profile
      const response = await api.get('/api/profile');
      return response.data.mode || 'tease_toes';
    } catch (err) {
      return 'tease_toes'; // Default mode
    }
  },
  
  // Switch mode (disabled for MVP)
  switch: async (newMode) => {
    if (!['tease_toes', 'apocalypse_ankles'].includes(newMode)) {
      return Promise.reject('Invalid mode');
    }
    
    const response = await api.put('/api/mode', { mode: newMode });
    
    // Update local storage
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      user.mode = newMode;
      localStorage.setItem('user', JSON.stringify(user));
    }
    
    return response;
  },
  
  // Check if user can access Apocalypse mode (disabled for MVP)
  canAccessApocalypse: async () => {
    try {
      const response = await api.get('/api/challenge/stats');
      // Can access if completed 3+ challenges
      return response.data.totalCompleted >= 3;
    } catch (err) {
      return false;
    }
  },
  
  // Get mode benefits (for display - disabled for MVP)
  getBenefits: (mode) => {
    if (mode === 'apocalypse_ankles') {
      return [
        'See who liked you',
        'Unlimited daily swipes',
        'Priority in match queue',
        'Advanced filters',
        'Foot photo badges'
      ];
    } else {
      return [
        'Basic matching',
        'Limited swipes',
        'Standard filters'
      ];
    }
  }
};

// Challenge system (keeping for compatibility but disabled in UI)
export const challenges = {
  // Get today's challenge
  getToday: () => api.get('/api/challenge/today'),
  
  // Get user's challenge stats
  getStats: () => api.get('/api/challenge/stats'),
  
  // Mark challenge as complete (backend will verify)
  complete: (challengeId) => {
    if (!challengeId) {
      return Promise.reject('Challenge ID required');
    }
    return api.post('/api/challenge/complete', { challengeId });
  },
  
  // Check if today's challenge is complete
  checkToday: async () => {
    try {
      const response = await api.get('/api/challenge/stats');
      return response.data.completedToday || false;
    } catch (err) {
      return false;
    }
  },
  
  // Get challenge history (future feature)
  getHistory: () => api.get('/api/challenge/history'),
  
  // Get available rewards
  getRewards: () => {
    return [
      { id: 'mode_unlock', name: 'Apocalypse Mode (24h)', required: 1 },
      { id: 'bonus_swipes', name: '5 Bonus Swipes', required: 1 },
      { id: 'priority_queue', name: 'Priority Queue (7 days)', required: 3 },
      { id: 'verified_badge', name: 'Verified Badge', required: 5 }
    ];
  }
};

// Health check
export const health = {
  check: () => api.get('/health'),
  
  // Get server status and features
  getStatus: async () => {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (err) {
      return {
        status: 'error',
        message: 'Cannot connect to server'
      };
    }
  }
};

// Utility functions
export const utils = {
  // Format time for display
  formatTime: (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  },
  
  // Check if user is logged in
  isAuthenticated: () => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('token');
  },
  
  // Get current user data
  getCurrentUser: () => {
    if (typeof window === 'undefined') return null;
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  },
  
  // Clear all local data (for debugging)
  clearLocalData: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }
};

export default api;