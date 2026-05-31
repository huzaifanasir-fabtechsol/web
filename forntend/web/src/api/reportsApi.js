import { API_URL } from "./config";
const BASE_URL = `${API_URL}/api`;

async function authFetch(url, token) {
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.detail || "Request failed.");
  }
  return data;
}

/**
 * GET /api/reports/dashboard/?filter=allTime|thisMonth|lastMonth|thisYear|lastYear
 */
export function getReportsDashboard(token, filter = "allTime") {
  return authFetch(`${BASE_URL}/reports/dashboard/?filter=${filter}`, token);
}
