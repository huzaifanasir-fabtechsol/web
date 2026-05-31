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

// ── Course API ──────────────────────────────────────────────────────────────

/**
 * GET /api/courses/?search=&class_days=&page=&page_size=
 */
export function listCourses(token, { search = "", class_days = "", page = 1, page_size = 10 } = {}) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (class_days) params.set("class_days", class_days);
  params.set("page", page);
  params.set("page_size", page_size);
  return authFetch(`${BASE_URL}/courses/?${params}`, "GET", null, token);
}

/** GET /api/courses/:id/ */
export function getCourse(token, id) {
  return authFetch(`${BASE_URL}/courses/${id}/`, "GET", null, token);
}

/** POST /api/courses/ */
export function createCourse(token, data) {
  return authFetch(`${BASE_URL}/courses/`, "POST", data, token);
}

/** PATCH /api/courses/:id/ */
export function updateCourse(token, id, data) {
  return authFetch(`${BASE_URL}/courses/${id}/`, "PATCH", data, token);
}

/** DELETE /api/courses/:id/ */
export function deleteCourse(token, id) {
  return authFetch(`${BASE_URL}/courses/${id}/`, "DELETE", null, token);
}

// ── Course Enrollment API ───────────────────────────────────────────────────

/**
 * GET /api/courses/:id/enrollment/?tab=assigned|unassigned|all&search=&page=
 */
export function getCourseEnrollment(token, courseId, { tab = "assigned", search = "", page = 1, page_size = 15 } = {}) {
  const params = new URLSearchParams();
  params.set("tab", tab);
  if (search) params.set("search", search);
  params.set("page", page);
  params.set("page_size", page_size);
  return authFetch(`${BASE_URL}/courses/${courseId}/enrollment/?${params}`, "GET", null, token);
}

/** POST /api/courses/:id/enrollment/ — bulk enroll */
export function bulkEnrollStudents(token, courseId, studentIds) {
  return authFetch(`${BASE_URL}/courses/${courseId}/enrollment/`, "POST", { student_ids: studentIds }, token);
}

/** DELETE /api/courses/:id/enrollment/ — bulk unenroll */
export function bulkUnenrollStudents(token, courseId, studentIds) {
  return authFetch(`${BASE_URL}/courses/${courseId}/enrollment/`, "DELETE", { student_ids: studentIds }, token);
}

// ── Student API ──────────────────────────────────────────────────────────────

/**
 * GET /api/students/?search=&is_active=&page=&page_size=
 */
export function listStudents(token, { search = "", is_active = "", page = 1, page_size = 10 } = {}) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (is_active !== "") params.set("is_active", is_active);
  params.set("page", page);
  params.set("page_size", page_size);
  return authFetch(`${BASE_URL}/students/?${params}`, "GET", null, token);
}

/** GET /api/students/:id/ */
export function getStudent(token, id) {
  return authFetch(`${BASE_URL}/students/${id}/`, "GET", null, token);
}

/** POST /api/students/ — supports multipart (FormData) for profile_picture */
export function createStudent(token, data) {
  const isFormData = data instanceof FormData;
  return authFetch(`${BASE_URL}/students/`, "POST", data, token, isFormData);
}

/** PATCH /api/students/:id/ */
export function updateStudent(token, id, data) {
  const isFormData = data instanceof FormData;
  return authFetch(`${BASE_URL}/students/${id}/`, "PATCH", data, token, isFormData);
}

/** DELETE /api/students/:id/ */
export function deleteStudent(token, id) {
  return authFetch(`${BASE_URL}/students/${id}/`, "DELETE", null, token);
}

/** PATCH /api/students/bulk-status/ — bulk update is_active */
export function bulkUpdateStudentStatus(token, studentIds, isActive) {
  return authFetch(`${BASE_URL}/students/bulk-status/`, "PATCH", {
    student_ids: studentIds,
    is_active: isActive,
  }, token);
}
