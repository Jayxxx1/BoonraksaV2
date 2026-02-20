import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL;

if (!baseURL) {
  throw new Error(
    "VITE_API_URL is required but was not provided. " +
      "Set it explicitly in your .env file or environment variables " +
      "to point to the backend API base URL (including /api).",
  );
}

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to include the token
api.interceptors.request.use(
  (config) => {
    // 🆕 Don't attach token to auth endpoints (login/register) to prevent conflation
    if (config.url.includes("/auth/")) {
      return config;
    }

    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Add a response interceptor to handle common errors (e.g., 401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 🆕 Only force logout if we got a real 401 response from the server.
    // If error.response is undefined, it's likely a network error (server restarting).
    if (error.response?.status === 401) {
      console.error("Unauthorized access - token expired or invalid");

      // Force logout loop breaker
      window.dispatchEvent(new Event("auth:logout"));
    }
    return Promise.reject(error);
  },
);

export default api;
