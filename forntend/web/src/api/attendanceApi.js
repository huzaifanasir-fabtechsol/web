import { API_URL } from "./config";
const BASE_URL = `${API_URL}/api`;

/** Authenticated fetch helper */
async function authFetch(url, method = "GET", body = null, token = null) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(url, opts);

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

// ── Attendance API ────────────────────────────────────────────────────────────

/**
 * GET /api/attendance/
 * Filters: course_id, student_id, status, month, year, date, search, page, page_size
 * Defaults to current month if month/year not specified.
 */
export function listAttendance(token, filters = {}) {
  const params = new URLSearchParams();
  const allowed = [
    "course_id", "student_id", "status", "month", "year",
    "date", "search", "page", "page_size",
  ];
  allowed.forEach((k) => {
    if (filters[k] !== undefined && filters[k] !== "") params.set(k, filters[k]);
  });
  if (!params.has("page")) params.set("page", 1);
  if (!params.has("page_size")) params.set("page_size", 20);
  return authFetch(`${BASE_URL}/attendance/?${params}`, "GET", null, token);
}

/** GET /api/attendance/:id/ */
export function getAttendance(token, id) {
  return authFetch(`${BASE_URL}/attendance/${id}/`, "GET", null, token);
}

/** POST /api/attendance/ */
export function createAttendance(token, data) {
  return authFetch(`${BASE_URL}/attendance/`, "POST", data, token);
}

/** PATCH /api/attendance/:id/ */
export function updateAttendance(token, id, data) {
  return authFetch(`${BASE_URL}/attendance/${id}/`, "PATCH", data, token);
}

/** DELETE /api/attendance/:id/ */
export function deleteAttendance(token, id) {
  return authFetch(`${BASE_URL}/attendance/${id}/`, "DELETE", null, token);
}

/**
 * GET /api/attendance/course-students/?course_id=<id>&date=<YYYY-MM-DD>
 * Returns all active students with their pre-populated attendance for the given date.
 */
export function getCourseStudentsForAttendance(token, courseId, date) {
  const params = new URLSearchParams({ course_id: courseId });
  if (date) params.set("date", date);
  return authFetch(`${BASE_URL}/attendance/course-students/?${params}`, "GET", null, token);
}

/**
 * POST /api/attendance/log/
 * Bulk upsert attendance for a course + date.
 * Body: { course_id, date, attendance: [{ student_id, status, remarks }] }
 */
export function bulkLogAttendance(token, payload) {
  return authFetch(`${BASE_URL}/attendance/log/`, "POST", payload, token);
}
