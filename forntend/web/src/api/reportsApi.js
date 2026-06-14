import { API_URL } from "./config";
import { authFetch } from "./apiClient";
const BASE_URL = `${API_URL}/api`;

/**
 * GET /api/reports/dashboard/?filter=allTime|thisMonth|lastMonth|thisYear|lastYear
 */
export function getReportsDashboard(token, filter = "allTime") {
  return authFetch(`${BASE_URL}/reports/dashboard/?filter=${filter}`, token);
}
