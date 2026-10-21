import { API_URL } from "./config";
import { getMockResponse } from "./mockData";

// Listeners to keep AuthContext state synchronized with silent refreshes
const tokenListeners = [];

export function onTokenRefreshed(cb) {
  tokenListeners.push(cb);
}

function notifyTokenRefreshed(newToken) {
  tokenListeners.forEach((cb) => cb(newToken));
}

// Clear all authentication states and force a redirect to login
function forceLogout() {
  localStorage.removeItem("hrs_access");
  localStorage.removeItem("hrs_refresh");
  localStorage.removeItem("hrs_user");
  window.location.href = "/login";
}

/**
 * Shared authenticated fetch utility.
 * Automatically handles silent JWT token refresh and retries up to 2 times upon 401 responses.
 */
export async function authFetch(url, method = "GET", body = null, token = null, isFormData = false, retryCount = 0) {
  const currentToken = token || localStorage.getItem("hrs_access");

  const headers = {};
  if (!isFormData) headers["Content-Type"] = "application/json";
  if (currentToken) headers["Authorization"] = `Bearer ${currentToken}`;

  const opts = { method, headers };
  if (body) opts.body = isFormData ? body : JSON.stringify(body);

  if (currentToken?.startsWith("mock_")) {
    const mock = getMockResponse(url, method, body);
    if (mock !== undefined) return mock;
  }

  try {
    const res = await fetch(url, opts);

    if (res.status === 204) return null;

    if (res.status === 401) {
      if (retryCount >= 2) {
        forceLogout();
        throw new Error("Session expired. Please log in again.");
      }

      const refresh = localStorage.getItem("hrs_refresh");
      if (!refresh || refresh.startsWith("mock_")) {
        forceLogout();
        throw new Error("Session expired. Please log in again.");
      }

      try {
        const refreshRes = await fetch(`${API_URL}/api/accounts/token/refresh/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh }),
        });

        if (!refreshRes.ok) {
          forceLogout();
          throw new Error("Session expired. Please log in again.");
        }

        const refreshData = await refreshRes.json();
        const newAccess = refreshData.access;

        localStorage.setItem("hrs_access", newAccess);
        notifyTokenRefreshed(newAccess);

        // Retry the request with the new token
        return authFetch(url, method, body, newAccess, isFormData, retryCount + 1);
      } catch (err) {
        forceLogout();
        throw err;
      }
    }

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
  } catch (err) {
    if (err.name === "TypeError" || err.message?.includes("fetch")) {
      const mock = getMockResponse(url, method, body);
      if (mock !== undefined) return mock;
    }
    throw err;
  }
}
