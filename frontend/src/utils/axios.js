import axios from 'axios';
import store from '../redux/store';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const axiosInstance = axios.create({
  baseURL: apiUrl,
});

// Add a request interceptor to include token from Redux
axiosInstance.interceptors.request.use(
  (config) => {
    let token;
    try {
      // Try to get token from Redux store
      const state = store.getState();
      token = state.auth?.token;
    } catch (e) {
      // Fallback to localStorage if Redux is not available (SSR safety)
      token = localStorage.getItem('token');
    }
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance; 