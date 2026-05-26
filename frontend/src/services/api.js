import axios from 'axios';

// Vite exposes env vars as import.meta.env.VITE_*
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
});

const aiApi = axios.create({
  baseURL: import.meta.env.VITE_AI_API_URL || 'http://localhost:5000/api',
});

[api, aiApi].forEach((instance) => {
  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem('cpms_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  instance.interceptors.response.use(
    (res) => res,
    (err) => {
      if (err.response?.status === 401) {
        localStorage.clear();
        window.location.href = '/login';
      }
      return Promise.reject(err);
    }
  );
});

export { api, aiApi };
