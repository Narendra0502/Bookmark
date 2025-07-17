import axios from '../utils/Axios';

const authService = {
  // Login user
  async login(credentials) {
    const { data } = await axios.post('/users/login', credentials);
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    return data;
  },

  // Register user
  async register(userData) {
    const { data } = await axios.post('/users/register', userData);
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    return data;
  },

  // Get user profile
  async getProfile() {
    const { data } = await axios.get('/users/profile');
    return data;
  },

  // Logout user
  logout() {
    localStorage.removeItem('token');
  }
};

export default authService;
