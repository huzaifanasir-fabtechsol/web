import { API_URL } from "./config";
import { authFetch } from "./apiClient";
const BASE_URL = `${API_URL}/api`;

// ── Transaction API ──────────────────────────────────────────────────────────

/**
 * GET /api/billing/
 * Params: search, course, fee_type, status, payment_method, month, year,
 *         date_from, date_to, page, page_size
 */
export function listTransactions(token, filters = {}) {
  const params = new URLSearchParams();
  const allowed = [
    "search", "course", "fee_type", "status",
    "payment_method", "month", "year", "date_from", "date_to",
    "page", "page_size",
  ];
  allowed.forEach((k) => {
    if (filters[k] !== undefined && filters[k] !== "") params.set(k, filters[k]);
  });
  if (!params.has("page")) params.set("page", 1);
  if (!params.has("page_size")) params.set("page_size", 10);
  return authFetch(`${BASE_URL}/billing/?${params}`, "GET", null, token);
}

/** GET /api/billing/:id/ */
export function getTransaction(token, id) {
  return authFetch(`${BASE_URL}/billing/${id}/`, "GET", null, token);
}

/** POST /api/billing/ */
export function createTransaction(token, data) {
  return authFetch(`${BASE_URL}/billing/`, "POST", data, token);
}

/** PATCH /api/billing/:id/ */
export function updateTransaction(token, id, data) {
  return authFetch(`${BASE_URL}/billing/${id}/`, "PATCH", data, token);
}

/** DELETE /api/billing/:id/ */
export function deleteTransaction(token, id) {
  return authFetch(`${BASE_URL}/billing/${id}/`, "DELETE", null, token);
}
