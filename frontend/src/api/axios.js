import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add token to requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Dispatch loading event
    window.dispatchEvent(new CustomEvent('api-request-start'));
    return config;
  },
  (error) => {
    window.dispatchEvent(new CustomEvent('api-request-end'));
    return Promise.reject(error);
  }
);

// Handle responses
axiosInstance.interceptors.response.use(
  (response) => {
    window.dispatchEvent(new CustomEvent('api-request-end'));
    return response.data;
  },
  (error) => {
    window.dispatchEvent(new CustomEvent('api-request-end'));
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

export default axiosInstance;
