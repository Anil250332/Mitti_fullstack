import axios from 'axios';
//
const rawBaseUrl = (import.meta?.env?.VITE_API_URL || import.meta?.env?.VITE_API_BASE_URL || 'https://shriradhecollection.com/api').replace(/\/+$/, '');
const baseUrlObj = new URL(rawBaseUrl);
if (!baseUrlObj.pathname.startsWith('/api')) {
  baseUrlObj.pathname = `${baseUrlObj.pathname.replace(/\/+$/, '')}/api`;
}
export const API_BASE_URL = baseUrlObj.toString().replace(/\/+$/, '');


export function resolveUploadUrl(rawPath) {
  if (!rawPath) return '';
  const value = String(rawPath).trim().replace(/\\/g, '/');

  if (/^https?:\/\//i.test(value) || value.startsWith('data:')) {
    return value;
  }

  const baseUrl = API_BASE_URL.replace(/\/$/, '');
  const cleanPath = value.startsWith('/') ? value : `/${value}`;

  const finalUrl = `${baseUrl}${cleanPath}`;

  return finalUrl;
}


const api = axios.create({
  baseURL: API_BASE_URL,
});

// For external calls that should NOT have internal interceptors applied
export const externalApi = axios.create();

// Internal Request interceptor - attach token
api.interceptors.request.use(
  (config) => {
    // Ensure headers object exists
    config.headers = config.headers || {};

    // Detect external NimbusPost requests to avoid overriding their specific Bearer token
    const isExternalNimbusRequest =
      (config.url && config.url.includes('nimbuspost')) ||
      (config.baseURL && config.baseURL.includes('nimbuspost'));

    const isFormData = typeof FormData !== 'undefined' && config?.data instanceof FormData;

    // Handle Content-Type for non-FormData requests
    if (!isFormData) {
      if (!config.headers['Content-Type'] && !config.headers['content-type']) {
        config.headers['Content-Type'] = 'application/json';
      }
    } else {
      // For FormData, let the browser set the boundary
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    }

    // Attach internal token ONLY for non-external requests
    if (!isExternalNimbusRequest) {
      const token = localStorage.getItem('token');
      if (token && token.trim() && token !== 'null' && token !== 'undefined') {
        config.headers['Authorization'] = `Bearer ${token.trim()}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - mark auth errors for the internal API
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const message = String(error?.response?.data?.message || error?.response?.data?.error || "");

    const isAuthError = status === 401 || status === 403 || /authorization\s+token\s+missing/i.test(message);

    if (isAuthError) {
      error._isAuthError = true;
    }

    return Promise.reject(error);
  }
);

export default api;
