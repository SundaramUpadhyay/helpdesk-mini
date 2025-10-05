import axios from 'axios';

// TODO: Add retry logic for failed requests
// FIXME: Handle offline mode better

// Setup API client - took me forever to get the baseURL right lol
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000', // Keep it simple
  timeout: 15000, // Added timeout after getting stuck requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Debug API calls (remove in production)
if (import.meta.env.DEV) {
  console.log('API Base URL:', api.defaults.baseURL);
}

// Add token to requests automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    // console.log('Adding auth token to request:', config.url); // Debug line
  }
  return config;
});

// Response interceptor - handles errors globally
api.interceptors.response.use(
  (response) => {
    // All good
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message); // Always want to see errors
    
    if (error.response?.status === 401) {
      // User got logged out somehow
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // TODO: Show a better "session expired" message
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication stuff
export const authService = {
  async login(email, password) {
    try {
      const response = await api.post('/auth/login', { email, password });
      return response.data;
    } catch (error) {
      // Let the component handle the error display
      throw error;
    }
  },

  async register(userData) {
    // Destructure for cleaner code
    const { name, email, password, role = 'user' } = userData;
    const response = await api.post('/auth/register', { name, email, password, role });
    return response.data;
  },

  async logout() {
    try {
      // Call backend logout to track activity and session duration
      await api.post('/auth/logout');
      console.log('Logout activity tracked successfully');
    } catch (error) {
      console.warn('Failed to track logout activity:', error);
      // Don't fail logout if tracking fails
    } finally {
      // Always clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  getUser() {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch (err) {
      // Corrupted user data, clear it
      console.warn('Corrupted user data in localStorage');
      localStorage.removeItem('user');
      return null;
    }
  },

  isAuthenticated() {
    const token = localStorage.getItem('token');
    // TODO: Check if token is expired
    return !!token;
  },

  setAuth(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }
};

// Users stuff - might extend this later
export const userService = {
  async getUsers() {
    const response = await api.get('/api/users');
    return response.data;
  }
  // TODO: Add user profile update
  // TODO: Add user role management
};

// Main ticket operations
export const ticketService = {
  async createTicket(title, description) {
    // Generate unique key to prevent duplicate submissions
    const reqId = `tkt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      const response = await api.post('/api/tickets', 
        { title, description },
        { headers: { 'Idempotency-Key': reqId } }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to create ticket:', error);
      throw error;
    }
  },

  async getTickets(limit = 10, offset = 0, search = '') {
    // Default pagination works fine for now
    const response = await api.get('/api/tickets', {
      params: { 
        limit, 
        offset, 
        q: search 
      }
    });
    return response.data;
  },

  async getTicket(ticketId) {
    if (!ticketId) {
      throw new Error('Ticket ID is required');
    }
    const response = await api.get(`/api/tickets/${ticketId}`);
    return response.data;
  },

  async updateTicket(id, updates, version) {
    // Need version for optimistic locking
    const payload = { ...updates };
    if (version !== undefined) {
      payload.__v = version;
    }
    
    const response = await api.patch(`/api/tickets/${id}`, payload);
    return response.data;
  },

  async addComment(ticketId, text) {
    if (!text || text.trim().length === 0) {
      throw new Error('Comment text is required');
    }
    
    const response = await api.post(`/api/tickets/${ticketId}/comments`, { 
      text: text.trim() 
    });
    return response.data;
  },

  async getComments(ticketId) {
    const response = await api.get(`/api/tickets/${ticketId}/comments`);
    return response.data;
  }
  
  // TODO: Add comment editing
  // TODO: Add comment deletion for admins
};

// Admin service - for admin-only operations
export const adminService = {
  async getLoginActivities(params = {}) {
    const { limit = 50, offset = 0, userId, action, startDate, endDate } = params;
    
    const queryParams = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });
    
    if (userId) queryParams.append('userId', userId);
    if (action) queryParams.append('action', action);
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    
    const response = await api.get(`/api/admin/login-activities?${queryParams}`);
    return response.data;
  }
};

// Export the axios instance for direct use if needed
export { api };

export default api;