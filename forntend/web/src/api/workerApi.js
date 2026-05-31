import { API_URL } from "./config";
const BASE_URL = `${API_URL}/api`;

/** Authenticated fetch helper */
async function authFetch(url, method = "GET", body = null, token = null, isFormData = false) {
  const headers = {};
  if (!isFormData) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const opts = { method, headers };
  if (body) opts.body = isFormData ? body : JSON.stringify(body);

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

// ── Worker API ──────────────────────────────────────────────────────────────

/** GET /api/workers/?search=&gender=&page=&page_size= */
export function listWorkers(token, { search = "", gender = "", page = 1, page_size = 10 } = {}) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (gender) params.set("gender", gender);
  params.set("page", page);
  params.set("page_size", page_size);
  return authFetch(`${BASE_URL}/workers/?${params}`, "GET", null, token);
}

/** GET /api/workers/:id/ */
export function getWorker(token, id) {
  return authFetch(`${BASE_URL}/workers/${id}/`, "GET", null, token);
}

/** POST /api/workers/ — supports multipart (FormData) for profile photo */
export function createWorker(token, data) {
  const isFormData = data instanceof FormData;
  return authFetch(`${BASE_URL}/workers/`, "POST", data, token, isFormData);
}

/** PATCH /api/workers/:id/ — supports multipart (FormData) for profile photo */
export function updateWorker(token, id, data) {
  const isFormData = data instanceof FormData;
  return authFetch(`${BASE_URL}/workers/${id}/`, "PATCH", data, token, isFormData);
}

/** DELETE /api/workers/:id/ */
export function deleteWorker(token, id) {
  return authFetch(`${BASE_URL}/workers/${id}/`, "DELETE", null, token);
}
