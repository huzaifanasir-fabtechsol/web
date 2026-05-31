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

// ── Horse Owners API ─────────────────────────────────────────────────────────

export function listHorseOwners(token, { search = "", page = 1, page_size = 10, include_company = false } = {}) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  params.set("page", page);
  params.set("page_size", page_size);
  if (include_company) params.set("include_company", "true");
  return authFetch(`${BASE_URL}/horse/owners/?${params}`, "GET", null, token);
}

export function getHorseOwner(token, id) {
  return authFetch(`${BASE_URL}/horse/owners/${id}/`, "GET", null, token);
}

export function createHorseOwner(token, data) {
  return authFetch(`${BASE_URL}/horse/owners/`, "POST", data, token);
}

export function updateHorseOwner(token, id, data) {
  return authFetch(`${BASE_URL}/horse/owners/${id}/`, "PATCH", data, token);
}

export function deleteHorseOwner(token, id) {
  return authFetch(`${BASE_URL}/horse/owners/${id}/`, "DELETE", null, token);
}

// ── Horses API ───────────────────────────────────────────────────────────────

export function listHorses(token, { search = "", owner_name = "", owner_email = "", color = "", breed = "", horse_name = "", gender = "", page = 1, page_size = 10 } = {}) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (owner_name) params.set("owner_name", owner_name);
  if (owner_email) params.set("owner_email", owner_email);
  if (color) params.set("color", color);
  if (breed) params.set("breed", breed);
  if (horse_name) params.set("horse_name", horse_name);
  if (gender) params.set("gender", gender);
  params.set("page", page);
  params.set("page_size", page_size);
  return authFetch(`${BASE_URL}/horse/horses/?${params}`, "GET", null, token);
}

export function getHorse(token, id) {
  return authFetch(`${BASE_URL}/horse/horses/${id}/`, "GET", null, token);
}

export function createHorse(token, data) {
  return authFetch(`${BASE_URL}/horse/horses/`, "POST", data, token);
}

export function updateHorse(token, id, data) {
  return authFetch(`${BASE_URL}/horse/horses/${id}/`, "PATCH", data, token);
}

export function deleteHorse(token, id) {
  return authFetch(`${BASE_URL}/horse/horses/${id}/`, "DELETE", null, token);
}
