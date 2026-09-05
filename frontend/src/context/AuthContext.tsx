/**
 * Holds the current login state (do we have a valid-looking token?) and
 * exposes login/logout so any component can react to auth changes
 * without prop-drilling the token through every page.
 *
 * The token itself lives in localStorage (survives a page reload/PWA
 * relaunch); this context just mirrors "is one present" as React state
 * so the UI re-renders when it changes.
 */

import { createContext, useContext, useState, type ReactNode } from "react";
import * as authApi from "../api/auth";

interface AuthContextValue {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!localStorage.getItem("access_token"),
  );

  async function login(email: string, password: string) {
    const token = await authApi.login(email, password);
    localStorage.setItem("access_token", token);
    setIsAuthenticated(true);
  }

  async function signup(email: string, password: string) {
    await authApi.signup(email, password);
    // Signing up doesn't log the user in automatically — reuse the same
    // login flow so both paths issue a token the same way.
    await login(email, password);
  }

  function logout() {
    localStorage.removeItem("access_token");
    setIsAuthenticated(false);
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, signup, logout }}>
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
