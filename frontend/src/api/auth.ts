import { apiClient } from "./client";
import type { User } from "../types";

/** Create a new account. Throws (via axios) on duplicate email. */
export async function signup(name: string, email: string, password: string) {
  const { data } = await apiClient.post("/auth/signup", { name, email, password });
  return data;
}

/**
 * Log in and return the JWT access token.
 *
 * The backend's /auth/login route follows the OAuth2 "password flow"
 * spec, which expects form-encoded `username`/`password` fields (not
 * JSON) — hence URLSearchParams here instead of a plain object.
 */
export async function login(email: string, password: string): Promise<string> {
  const form = new URLSearchParams();
  form.set("username", email);
  form.set("password", password);

  const { data } = await apiClient.post("/auth/login", form, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return data.access_token as string;
}

/** Fetch the logged-in user's own profile (name, email, ...). */
export async function fetchMe(): Promise<User> {
  const { data } = await apiClient.get("/auth/me");
  return data;
}
