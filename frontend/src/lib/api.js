import axios from "axios";

export const TOKEN_KEY = "dayflow.token";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export function readError(error) {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (error.code === "ERR_NETWORK") {
    return "Cannot reach the server. Check that the backend is running on port 5000.";
  }

  return "Something went wrong. Try again in a moment.";
}

export default api;
