import { API_URL } from "./config";
import { authFetch } from "./apiClient";
const BASE_URL = `${API_URL}/api`;

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
