import api from './api';

/**
 * Auth API calls — thin wrappers around the backend auth endpoints.
 *
 * Auth is httpOnly cookie only. We never send or store a Bearer token;
 * the browser sends the cookie automatically thanks to withCredentials:true.
 *
 * This layer knows nothing about React state; it just returns data.
 * The AuthContext calls these functions and manages user state.
 */
export const authService = {
  /**
   * GET /api/auth/me
   * Checks if the httpOnly cookie is still valid.
   * Server decodes the JWT from the cookie and returns { user } or 401.
   * Called once on app mount to restore session after a page refresh.
   */
  checkAuth: () => api.get('/auth/me').then((res) => res.data),

  /**
   * POST /api/auth/login
   * Sends email + password. Server validates credentials and sets an
   * httpOnly cookie via the Set-Cookie header. Returns { user }.
   */
  login: (email, password) =>
    api.post('/auth/login', { email, password }).then((res) => res.data),

  /**
   * POST /api/auth/logout
   * Tells the server to clear the httpOnly cookie (Set-Cookie with
   * Max-Age=0). We MUST call the server — just clearing client state
   * isn't enough because the cookie would still be valid.
   */
  logout: () => api.post('/auth/logout'),
};
