import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 120000, // 2 minutes for video uploads
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
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, {
      timeout: config.timeout,
      dataSize: config.data instanceof FormData ? `FormData with ${config.data.get('video')?.size || 0} bytes` : undefined
    });
    window.dispatchEvent(new CustomEvent('api-request-start'));
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error.message);
    window.dispatchEvent(new CustomEvent('api-request-end'));
    return Promise.reject(error);
  }
);

// Handle responses
axiosInstance.interceptors.response.use(
  (response) => {
    console.log(`[API] Response ${response.status}:`, response.config.url);
    window.dispatchEvent(new CustomEvent('api-request-end'));
    return response.data;
  },
  (error) => {
    console.error('[API Error]', error.message, {
      status: error.response?.status,
      url: error.config?.url,
      timeout: error.code === 'ECONNABORTED'
    });
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
