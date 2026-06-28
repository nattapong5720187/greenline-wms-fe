import axios from "axios";
import Cookies from "js-cookie";
import apiClient from "./axios";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

export function apiLogin(username, password) {
  return axios.post(`${BASE}/api/auth/login`, { username, password });
}

export function apiRefresh(refreshToken) {
  return axios.post(`${BASE}/api/auth/refresh`, { refreshToken });
}

export function apiLogout() {
  const accessToken = Cookies.get("access_token");
  const refreshToken = Cookies.get("refresh_token");
  return axios.post(
    `${BASE}/api/auth/logout`,
    { refreshToken },
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
}

export function apiGetMe() {
  return apiClient.get("/api/auth/me");
}
