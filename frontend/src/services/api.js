import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.PROD ? '' : 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth service
export const authService = {
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  async register(name, email, password, role = 'user') {
    const response = await api.post('/auth/register', { name, email, password, role });
    return response.data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem('token');
  },

  setAuth(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }
};

// User service
export const userService = {
  async getUsers() {
    const response = await api.get('/api/users');
    return response.data;
  }
};

// Ticket service
export const ticketService = {
  async createTicket(title, description) {
    // Generate idempotency key for ticket creation
    const idempotencyKey = `ticket-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const response = await api.post('/api/tickets', 
      { title, description },
      { headers: { 'Idempotency-Key': idempotencyKey } }
    );
    return response.data;
  },

  async getTickets(limit = 10, offset = 0, search = '') {
    const response = await api.get('/api/tickets', {
      params: { limit, offset, q: search }
    });
    return response.data;
  },

  async getTicket(id) {
    const response = await api.get(`/api/tickets/${id}`);
    return response.data;
  },

  async updateTicket(id, updates, version) {
    const response = await api.patch(`/api/tickets/${id}`, {
      ...updates,
      __v: version
    });
    return response.data;
  },

  async addComment(ticketId, text) {
    const response = await api.post(`/api/tickets/${ticketId}/comments`, { text });
    return response.data;
  },

  async getComments(ticketId) {
    const response = await api.get(`/api/tickets/${ticketId}/comments`);
    return response.data;
  }
};

export default api;