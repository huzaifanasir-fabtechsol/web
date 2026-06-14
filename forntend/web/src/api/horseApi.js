import { API_URL } from "./config";
import { authFetch } from "./apiClient";
const BASE_URL = `${API_URL}/api`;

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
  const isFormData = data instanceof FormData;
  return authFetch(`${BASE_URL}/horse/horses/`, "POST", data, token, isFormData);
}

export function updateHorse(token, id, data) {
  const isFormData = data instanceof FormData;
  return authFetch(`${BASE_URL}/horse/horses/${id}/`, "PATCH", data, token, isFormData);
}

export function deleteHorse(token, id) {
  return authFetch(`${BASE_URL}/horse/horses/${id}/`, "DELETE", null, token);
}
