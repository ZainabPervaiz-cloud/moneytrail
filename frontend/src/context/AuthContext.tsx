/**
 * Holds the current login state (do we have a valid-looking token, and
 * whose profile is it?) and exposes login/logout so any component can
 * react to auth changes without prop-drilling the token/user through
 * every page.
 *
 * The token itself lives in localStorage (survives a page reload/PWA
 * relaunch); this context mirrors "is one present" plus the fetched
 * profile as React state so the UI (e.g. the dashboard greeting)
 * re-renders when either changes.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import * as authApi from "../api/auth";
import type { User } from "../types";

interface AuthContextValue {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!localStorage.getItem("access_token"),
  );
  const [user, setUser] = useState<User | null>(null);

  // On first load (e.g. reopening the installed PWA with a token still
  // in localStorage from a previous session), fetch who that token
  // belongs to so the greeting is right without requiring a fresh login.
  useEffect(() => {
    if (isAuthenticated) {
      authApi.fetchMe().then(setUser).catch(() => setIsAuthenticated(false));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function login(email: string, password: string) {
    const token = await authApi.login(email, password);
    localStorage.setItem("access_token", token);
    setIsAuthenticated(true);
    setUser(await authApi.fetchMe());
  }

  async function signup(name: string, email: string, password: string) {
    await authApi.signup(name, email, password);
    // Signing up doesn't log the user in automatically — reuse the same
    // login flow so both paths issue a token the same way.
    await login(email, password);
  }

  function logout() {
    localStorage.removeItem("access_token");
    setIsAuthenticated(false);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Convenience hook so components can just call useAuth() instead of
 *  importing useContext + AuthContext every time. */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
