import { API_URL } from "./config";
import { authFetch } from "./apiClient";
const BASE_URL = `${API_URL}/api/accounts`;

/**
 * GET /api/accounts/settings/
 * Returns the SystemSettings singleton.
 * smtp_password is NOT returned (write-only on backend).
 */
export function getSystemSettings(token) {
  return authFetch(`${BASE_URL}/settings/`, "GET", null, token);
}

/**
 * PATCH /api/accounts/settings/
 * Accepts FormData (for profile_picture upload) or plain JSON.
 * Pass a FormData object for multipart, or a plain object for JSON.
 */
export function updateSystemSettings(token, data) {
  const isFormData = data instanceof FormData;
  return authFetch(`${BASE_URL}/settings/`, "PATCH", data, token, isFormData);
}

/**
 * POST /api/accounts/change-password/
 * Body: { current_password, new_password, confirm_password }
 */
export function changePassword(token, { current_password, new_password, confirm_password }) {
  return authFetch(`${BASE_URL}/change-password/`, "POST", { current_password, new_password, confirm_password }, token);
}

/**
 * POST /api/accounts/holiday/
 * Body: { date }
 */
export function postHoliday(token, date) {
  return authFetch(`${BASE_URL}/holiday/`, "POST", { date }, token);
}

/**
 * DELETE /api/accounts/holiday/
 * Body: { date }
 */
export function deleteHoliday(token, date) {
  return authFetch(`${BASE_URL}/holiday/`, "DELETE", { date }, token);
}

/**
 * GET /api/accounts/off-days/
 */
export function getOffDays(token) {
  return authFetch(`${BASE_URL}/off-days/`, "GET", null, token);
}
