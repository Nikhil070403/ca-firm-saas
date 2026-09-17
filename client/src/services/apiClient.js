import axios from 'axios';

// Relative by default so it works both in dev (the Vite proxy forwards
// /api -> the backend) and in a single-origin production deploy (the API and
// the built app are served from the same host). Set VITE_API_URL only when
// the backend lives on a different origin than the frontend.
const baseURL = import.meta.env.VITE_API_URL || '/api/v1';

const apiClient = axios.create({ baseURL, withCredentials: true });

// Held in memory (not localStorage) so an XSS payload reading localStorage
// can't lift a usable access token — the refresh token that can mint a new
// one lives only in an httpOnly cookie the page can't read either way.
let accessToken = null;
let onUnauthorized = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshPromise = null;

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    const isAuthRoute = config?.url?.includes('/auth/');

    if (response?.status === 401 && !config._retried && !isAuthRoute) {
      config._retried = true;
      try {
        refreshPromise = refreshPromise || apiClient.post('/auth/refresh');
        const { data } = await refreshPromise;
        refreshPromise = null;
        setAccessToken(data.data.accessToken);
        config.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return apiClient(config);
      } catch (refreshError) {
        refreshPromise = null;
        setAccessToken(null);
        if (onUnauthorized) onUnauthorized();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export function extractErrorMessage(error) {
  return error?.response?.data?.message || error?.message || 'Something went wrong';
}

export default apiClient;
