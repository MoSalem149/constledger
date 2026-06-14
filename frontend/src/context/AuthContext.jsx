import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { authService } from "../services/authService";
import { setOnUnauthorized } from "../services/api";
import { normalizeId } from "../utils/normalizeId";

const AuthContext = createContext(null);

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

  // loading=true initially to prevent flash redirect in PrivateRoute.
  // PrivateRoute calls checkSession() on mount; LoginPage never reads loading.
  const [loading, setLoading] = useState(true);
  const initializedRef = useRef(false);

  // ------------------------------------------------------------------
  // 1. Restore session — called by PrivateRoute on mount (not on mount of
  //    AuthProvider). This avoids a wasteful /auth/me call when the user
  //    opens the public /login page without a cookie.
  // ------------------------------------------------------------------
  const checkSession = useCallback(async () => {
    if (initializedRef.current) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await authService.checkAuth();
      setUser(normalizeId(data.user));
    } catch {
      setUser(null);
    } finally {
      initializedRef.current = true;
      setLoading(false);
    }
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
    const normalized = normalizeId(data.user);
    setUser(normalized);
    initializedRef.current = true;
    setLoading(false);
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
    isAuthenticated: !!user,
    login,
    logout,
    hasRole,
    checkSession,
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
