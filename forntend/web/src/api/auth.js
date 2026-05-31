import { API_URL } from "./config";
const BASE_URL = `${API_URL}/api/accounts`;

/**
 * Helper: perform a JSON POST request.
 */
async function post(endpoint, body) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // DRF validation errors come back as { non_field_errors: [...] } or { field: [...] }
    const message =
      data?.non_field_errors?.[0] ||
      data?.detail ||
      Object.values(data).flat()[0] ||
      "An unexpected error occurred.";
    throw new Error(message);
  }

  return data;
}

/**
 * Helper: perform an authenticated JSON GET/PATCH request.
 */
async function authRequest(endpoint, method = "GET", body = null, token) {
  const opts = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${endpoint}`, opts);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      data?.detail ||
      data?.non_field_errors?.[0] ||
      Object.values(data).flat()[0] ||
      "Request failed.";
    throw new Error(message);
  }

  return data;
}

// ── Auth endpoints ────────────────────────────────────────────────────────────

/**
 * POST /api/accounts/login/
 * Returns { access, refresh, user: { id, email, full_name } }
 */
export function login(email, password) {
  return post("/login/", { email, password });
}

/**
 * POST /api/accounts/token/refresh/
 * Returns { access }
 */
export function refreshToken(refresh) {
  return post("/token/refresh/", { refresh });
}

/**
 * POST /api/accounts/forgot-password/
 * Returns { detail: "Password reset email sent." }
 */
export function forgotPassword(email) {
  return post("/forgot-password/", { email });
}

/**
 * POST /api/accounts/reset-password/
 * Returns { detail: "Password has been reset." }
 */
export function resetPassword(uid, token, new_password) {
  return post("/reset-password/", { uid, token, new_password });
}

/**
 * GET /api/accounts/profile/
 * Returns the authenticated user's profile.
 */
export function getProfile(token) {
  return authRequest("/profile/", "GET", null, token);
}

/**
 * PATCH /api/accounts/profile/
 * Returns the updated user profile.
 */
export function updateProfile(token, data) {
  return authRequest("/profile/", "PATCH", data, token);
}
