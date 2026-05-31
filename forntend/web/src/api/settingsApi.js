import { API_URL } from "./config";
const BASE_URL = `${API_URL}/api/accounts`;

/** Authenticated fetch helper — supports both JSON and FormData */
async function authFetch(endpoint, method = "GET", body = null, token = null, isFormData = false) {
  const headers = {};
  if (!isFormData) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const opts = { method, headers };
  if (body) opts.body = isFormData ? body : JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${endpoint}`, opts);

  // 204 No Content
  if (res.status === 204) return null;

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

/**
 * GET /api/accounts/settings/
 * Returns the SystemSettings singleton.
 * smtp_password is NOT returned (write-only on backend).
 */
export function getSystemSettings(token) {
  return authFetch("/settings/", "GET", null, token);
}

/**
 * PATCH /api/accounts/settings/
 * Accepts FormData (for profile_picture upload) or plain JSON.
 * Pass a FormData object for multipart, or a plain object for JSON.
 */
export function updateSystemSettings(token, data) {
  const isFormData = data instanceof FormData;
  return authFetch("/settings/", "PATCH", data, token, isFormData);
}

/**
 * POST /api/accounts/change-password/
 * Body: { current_password, new_password, confirm_password }
 */
export function changePassword(token, { current_password, new_password, confirm_password }) {
  return authFetch("/change-password/", "POST", { current_password, new_password, confirm_password }, token);
}
