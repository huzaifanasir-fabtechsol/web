import { API_URL } from "./config";
import { authFetch } from "./apiClient";
const BASE_URL = `${API_URL}/api`;

/** GET /api/dashboard/summary */
export function getDashboardSummary(token) {
  return authFetch(`${BASE_URL}/dashboard/summary/`, token);
}

/**
 * GET /api/dashboard/revenue-trend?range=last12Months|lastMonth|thisMonth
 * Returns [{ label, revenue }]
 */
export function getRevenueTrend(token, range = "last12Months") {
  return authFetch(`${BASE_URL}/dashboard/revenue-trend/?range=${range}`, token);
}

/** GET /api/dashboard/latest-horses */
export function getLatestHorses(token) {
  return authFetch(`${BASE_URL}/dashboard/latest-horses/`, token);
}

/** GET /api/dashboard/latest-students */
export function getLatestStudents(token) {
  return authFetch(`${BASE_URL}/dashboard/latest-students/`, token);
}
