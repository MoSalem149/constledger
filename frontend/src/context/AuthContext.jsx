import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { authService } from "../services/authService";
import { setOnUnauthorized } from "../services/api";

const AuthContext = createContext(null);

/**
 * Backend returns `_id` for /auth/me and `id` for /login. We normalize to `id`
 * so the rest of the frontend can always read `user.id`.
 */
function normalizeUser(raw) {
  if (!raw) return null;
  const { _id, ...rest } = raw;
  return { ...rest, id: rest.id ?? _id };
}

/**
 * AuthProvider — wraps the entire app and manages authentication state.
 *
 * Holds:
 *   user          → { name, email, role } or null
 *   loading       → true while checking /auth/me on mount (prevents flash)
 *   isAuthenticated → derived boolean for convenience
 *
 * Exposes:
 *   login(email, password)  → authenticates + sets user
 *   logout()                → clears cookie + sets user to null
 *   hasRole(...roles)       → checks if current user has any of the given roles
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // loading=true until the first /auth/me call resolves.
  // This prevents a flash of the login screen while we check if the
  // httpOnly cookie is still valid on page refresh.
  const [loading, setLoading] = useState(true);

  // ------------------------------------------------------------------
  // 1. Restore session from cookie on mount
  // ------------------------------------------------------------------
  useEffect(() => {
    authService
      .checkAuth()
      .then((data) => setUser(normalizeUser(data.user)))
      .catch(() => setUser(null)) // 401 or network error → not authenticated
      .finally(() => setLoading(false));
  }, []);

  // ------------------------------------------------------------------
  // 2. Inject logout into Axios (callback injection — no DOM events)
  // ------------------------------------------------------------------
  //
  // Axios interceptors can't use React hooks, so we can't call useAuth()
  // inside api.js. Instead, AuthProvider registers its logout function
  // with the Axios instance via setOnUnauthorized().
  //
  // If any API call returns 401, the interceptor calls this function,
  // which clears user state. That triggers PrivateRoute to redirect to
  // /login — no manual logout needed.
  const logout = useCallback(async () => {
    await authService.logout(); // server clears the cookie
    setUser(null);
  }, []);

  useEffect(() => {
    setOnUnauthorized(logout);
    return () => setOnUnauthorized(null); // cleanup on unmount
  }, [logout]);

  // ------------------------------------------------------------------
  // 3. Login action
  // ------------------------------------------------------------------
  const login = useCallback(async (email, password) => {
    const data = await authService.login(email, password);
    const normalized = normalizeUser(data.user);
    setUser(normalized);
    return normalized;
  }, []);

  // ------------------------------------------------------------------
  // 4. Role checker
  // ------------------------------------------------------------------
  // Spreads args so you can call:
  //   hasRole('contract_manager')
  //   hasRole('contract_manager', 'finance_team')
  const hasRole = useCallback(
    (...roles) => {
      return user ? roles.includes(user.role) : false;
    },
    [user],
  );

  const value = {
    user,
    loading,
    isAuthenticated: !!user, // convenient boolean
    login,
    logout,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth — hook to read auth state anywhere in the component tree.
 * Must be used inside <AuthProvider>.
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export default AuthContext;