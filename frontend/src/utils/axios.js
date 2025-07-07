import axios from 'axios';
import store from '../redux/store';
import { logout, loginSuccess } from '../redux/authSlice';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const axiosInstance = axios.create({
  baseURL: apiUrl,
  withCredentials: true, // Send cookies (for refresh token)
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
      token = null;
    }
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const skipRefreshEndpoints = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

axiosInstance.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      !skipRefreshEndpoints.includes(originalRequest.url)
    ) {
      originalRequest._retry = true;
      try {
        // Call refresh endpoint (refresh token sent via cookie)
        const res = await axios.post(`${apiUrl}/auth/refresh`, {}, { withCredentials: true });
        const { access_token, user } = res.data;
        store.dispatch(loginSuccess({ user, token: access_token }));
        originalRequest.headers['Authorization'] = `Bearer ${access_token}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        store.dispatch(logout());
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance; 