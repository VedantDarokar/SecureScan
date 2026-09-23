import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('securescan_token') || localStorage.getItem('secscan_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const checkHealth = async () => {
  const rootUrl = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
  const res = await axios.get(`${rootUrl}/health`);
  return res.data;
};

// Scan APIs
export const startScan = async (target_url) => {
  const res = await apiClient.post('/scans', { target_url });
  return res.data;
};

export const getScanDetails = async (scanId) => {
  const res = await apiClient.get(`/scans/${scanId}`);
  return res.data;
};

export const getScansList = async () => {
  const res = await apiClient.get('/scans');
  return res.data;
};

export const deleteScan = async (scanId) => {
  const res = await apiClient.delete(`/scans/${scanId}`);
  return res.data;
};

export const downloadScanReport = (scanId) => {
  window.open(`${API_BASE_URL}/scans/${scanId}/report`, '_blank');
};

// AI Remediation APIs
export const remediateAllFindings = async (scanId) => {
  const res = await apiClient.post(`/scans/${scanId}/remediate`);
  return res.data;
};

export const remediateSingleFinding = async (vulnId) => {
  const res = await apiClient.post(`/scans/vulnerabilities/${vulnId}/remediate`);
  return res.data;
};

// Auth APIs
export const loginUser = async (email, password) => {
  const res = await apiClient.post('/auth/login-json', { email, password });
  if (res.data.access_token) {
    localStorage.setItem('securescan_token', res.data.access_token);
  }
  return res.data;
};

export const registerUser = async (email, password, full_name) => {
  const res = await apiClient.post('/auth/register', { email, password, full_name });
  return res.data;
};

export const getAuthConfig = async () => {
  const res = await apiClient.get('/auth/config');
  return res.data;
};

export const loginWithGoogle = async (googlePayload) => {
  const res = await apiClient.post('/auth/google', googlePayload);
  if (res.data.access_token) {
    localStorage.setItem('securescan_token', res.data.access_token);
  }
  return res.data;
};

export const getMe = async () => {
  const res = await apiClient.get('/auth/me');
  return res.data;
};

export const logoutUser = () => {
  localStorage.removeItem('securescan_token');
  localStorage.removeItem('secscan_token');
};

export default apiClient;
