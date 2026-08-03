import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

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
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);

function extractErrorMessage(error) {
  return (
    error.response?.data?.message ||
    error.response?.data?.error ||
    "Something went wrong. Please try again."
  );
}

const authService = {
  async register(payload) {
    try {
      const { data } = await api.post("/auth/register", payload);
      return data;
    } catch (error) {
      throw extractErrorMessage(error);
    }
  },
  async login(payload) {
    try {
      const { data } = await api.post("/auth/login", payload);
      if (data.accessToken)
        localStorage.setItem("accessToken", data.accessToken);
      if (data.refreshToken)
        localStorage.setItem("refreshToken", data.refreshToken);
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
    }
  },
  async requestPasswordReset(email) {
    try {
      const { data } = await api.post("/auth/forgot-password", { email });
      return data;
    } catch (error) {
      throw extractErrorMessage(error);
    }
  },
  async resetPassword(payload) {
    try {
      const { data } = await api.post("/auth/reset-password", payload);
      return data;
    } catch (error) {
      throw extractErrorMessage(error);
    }
  },
  async verifyEmail(token) {
    try {
      const { data } = await api.post("/auth/verify-email", { token });
      return data;
    } catch (error) {
      throw extractErrorMessage(error);
    }
  },
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
export { api, extractErrorMessage };
