import axios from 'axios';

// Create an Axios instance pointing to our backend API
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Add Authorization header if token exists
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('rn_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Intercept 401 Unauthorized responses to remove invalid tokens, and normalize network errors
axiosClient.interceptors.response.use((response) => {
  return response;
}, (error) => {
  if (error.response && error.response.status === 401) {
    localStorage.removeItem('rn_token');
  }

  // Network connection error handling (server offline / unreachable)
  if (!error.response) {
    const friendlyMessage = 'Unable to connect to the server. Please check your connection and try again.';
    error.message = friendlyMessage;
    if (error.response?.data) {
      error.response.data.message = friendlyMessage;
    } else {
      error.response = {
        data: {
          success: false,
          message: friendlyMessage
        }
      };
    }
  }

  return Promise.reject(error);
});

export default axiosClient;
