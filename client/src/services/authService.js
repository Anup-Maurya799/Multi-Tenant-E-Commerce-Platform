import axios from "axios";

/**
 * Single axios instance for the whole app. Every service file should import
 * this instead of calling axios directly — one place to configure the base
 * URL, headers, and token handling.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1",
  headers: { "Content-Type": "application/json" },
});

/**
 * Request interceptor: attach the JWT access token (if we have one) to every
 * outgoing request. Keeps individual API calls free of auth boilerplate.
 */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/**
 * Response interceptor: if the backend says the access token is expired
 * (401), try once to refresh it and replay the original request. If that
 * also fails, clear the session and let the app redirect to /login.
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem("refreshToken");
        const { data } = await axios.post(
          `${api.defaults.baseURL}/auth/refresh-token`,
          { refreshToken },
        );
        localStorage.setItem("accessToken", data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("isLoggedIn");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

/**
 * Normalizes whatever shape the backend sends back on error into a plain
 * string, so every page can just do `catch (err) { setMessage(err) }`
 * instead of digging into err.response.data each time.
 */
function extractErrorMessage(error) {
  return (
    error.response?.data?.message ||
    error.response?.data?.error ||
    "Something went wrong. Please try again."
  );
}

const authService = {
  /**
   * @param {{ name: string, email: string, password: string, role: 'vendor'|'customer' }} payload
   */
  async register(payload) {
    try {
      const { data } = await api.post("/auth/register", payload);
      return data;
    } catch (error) {
      throw extractErrorMessage(error);
    }
  },

  /**
   * @param {{ email: string, password: string }} payload
   */
  async login(payload) {
    try {
      const { data } = await api.post("/auth/login", payload);
      if (data.accessToken)
        localStorage.setItem("accessToken", data.accessToken);
      if (data.refreshToken)
        localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("activeRole", data.user?.role || "customer");
      return data;
    } catch (error) {
      throw extractErrorMessage(error);
    }
  },

  async logout() {
    try {
      await api.post("/auth/logout");
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("activeRole");
    }
  },

  /** @param {string} email */
  async requestPasswordReset(email) {
    try {
      const { data } = await api.post("/auth/forgot-password", { email });
      return data;
    } catch (error) {
      throw extractErrorMessage(error);
    }
  },

  /** @param {{ token: string, newPassword: string }} payload */
  async resetPassword(payload) {
    try {
      const { data } = await api.post("/auth/reset-password", payload);
      return data;
    } catch (error) {
      throw extractErrorMessage(error);
    }
  },

  /** @param {string} token */
  async verifyEmail(token) {
    try {
      const { data } = await api.post("/auth/verify-email", { token });
      return data;
    } catch (error) {
      throw extractErrorMessage(error);
    }
  },

  /** @param {string} email */
  async resendVerificationEmail(email) {
    try {
      const { data } = await api.post("/auth/resend-verification", { email });
      return data;
    } catch (error) {
      throw extractErrorMessage(error);
    }
  },

  async getCurrentUser() {
    try {
      const { data } = await api.get("/auth/me");
      return data;
    } catch (error) {
      throw extractErrorMessage(error);
    }
  },
};

export default authService;
export { api };
