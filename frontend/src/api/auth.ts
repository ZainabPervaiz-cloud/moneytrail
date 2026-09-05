import { apiClient } from "./client";

/** Create a new account. Throws (via axios) on duplicate email. */
export async function signup(email: string, password: string) {
  const { data } = await apiClient.post("/auth/signup", { email, password });
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
