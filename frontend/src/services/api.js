import axios from 'axios';

/**
 * Axios instance — single source of truth for all API calls.
 * Pre-configured with the backend base URL and credentials flag.
 */
const api = axios.create({
  // VITE_API_URL is injected by Vite at build time from .env.local
  baseURL: import.meta.env.VITE_API_URL,

  // withCredentials is REQUIRED for the httpOnly cookie auth flow.
  // The access token lives in an httpOnly cookie set by the server; the
  // browser sends it automatically on every request. There is no refresh
  // token and we never store or read the token in JS — this keeps us
  // XSS-safe by design. On 401 the interceptor calls onUnauthorized() to
  // clear the React auth state and redirect to /login.
  withCredentials: true,

  headers: { 'Content-Type': 'application/json' },
});

/* ------------------------------------------------------------------ */
// 401 handler — callback injection pattern
/* ------------------------------------------------------------------ */

// Axios interceptors run outside React's render cycle, so they can't
// call useAuth(). Directly importing AuthContext here would create a
// circular dependency (api.js → authService.js → AuthContext → api.js).
//
// Instead, we expose a setter. AuthProvider injects its logout function
// via setOnUnauthorized() after mount. The interceptor calls that
// function — no DOM events, no circular imports, fully testable.
let onUnauthorized = null;

export const setOnUnauthorized = (fn) => {
  onUnauthorized = fn;
};

// Response interceptor: global 401 handler
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && onUnauthorized) {
      // Cookie expired or invalid — force logout.
      // AuthProvider clears user state, which triggers PrivateRoute
      // to redirect to /login automatically.
      onUnauthorized();
    }
    return Promise.reject(error);
  }
);

export default api;