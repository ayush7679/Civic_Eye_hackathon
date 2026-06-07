import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 globally — clear session and redirect
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth';
    }
    const message = error.response?.data?.message || error.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);

// ─── Auth ────────────────────────────────────────────────────────────────────

export const loginUser = (username, password) =>
  api.post('/login', { username, password }).then(r => r.data);

export const registerUser = (username, password) =>
  api.post('/register', { username, password }).then(r => r.data);

// ─── Reports ─────────────────────────────────────────────────────────────────

/**
 * @param {Object} params - Optional filters: status, category, exclude_fixed
 */
export const getReports = (params = {}) =>
  api.get('/database', { params }).then(r => r.data);

export const uploadImage = (base64Image) =>
  api.post('/upload', { image: base64Image }).then(r => r.data);

export const analyzeImage = (filePath, gpsX, gpsY, category, title) =>
  api.post('/analyze', { filePath, gpsX, gpsY, category, title }).then(r => r.data);

export const updateVerification = (reportId, verificationStatus) =>
  api.post('/updateVerification', { reportId, verificationStatus }).then(r => r.data);

export const updateStatus = (reportId, status) =>
  api.post('/updateStatus', { reportId, status }).then(r => r.data);

export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  const filename = imagePath.split('/').pop();
  return `${BASE_URL}/images/${filename}`;
};

export default api;
