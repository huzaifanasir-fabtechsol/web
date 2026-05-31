import { API_URL } from "./config";
const BASE_URL = `${API_URL}/api`;

/** Authenticated fetch helper */
async function authFetch(url, method = "GET", body = null, token = null) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(url, opts);

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
