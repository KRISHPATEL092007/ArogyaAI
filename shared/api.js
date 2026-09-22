/**
 * Shared code between client and server.
 *
 * On the client this is the single place that talks to the Express API:
 * it attaches the auth token, serializes JSON (or passes through
 * FormData for file uploads), and normalizes error handling so every
 * page can just `await api.get(...)` / `await api.post(...)`.
 */

// Empty by default: requests go to relative "/api/..." paths, which the
// Vite dev proxy forwards to the Flask backend on localhost:5000. Set
// VITE_API_BASE_URL (e.g. "https://your-flask-host.com") when the frontend
// and backend are deployed on different origins in production.
export const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || "";

//export const API_BASE_URL = "http://10.231.64.155:5000";

const TOKEN_KEY = "arogya_token";
const ROLE_KEY = "arogya_role";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRole() {
  return localStorage.getItem(ROLE_KEY);
}

export function setAuth(token, role) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ROLE_KEY, role);
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
}

export function isAuthenticated() {
  return Boolean(getToken());
}

async function request(path, { method = "GET", body } = {}) {
  const token = getToken();
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  const headers = {};
  if (!isFormData && body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api${path}`, {
    method,
    headers,
    body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    throw new Error(data?.error || "Something went wrong. Please try again.");
  }

  return data;
}

export const api = {
  get: (path) => request(path, { method: "GET" }),
  post: (path, body) => request(path, { method: "POST", body }),
  put: (path, body) => request(path, { method: "PUT", body }),
  patch: (path, body) => request(path, { method: "PATCH", body }),
};

/** Builds a download URL for a record's PDF report, including the auth
 * token as a query param so a plain <a href> / window.open works. */
export function reportUrl(recordId) {
  const token = getToken();
  return `${API_BASE_URL}/api/records/${recordId}/report?token=${encodeURIComponent(token || "")}`;
}
