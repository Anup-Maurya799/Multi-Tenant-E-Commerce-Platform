import { api, extractErrorMessage } from "./authService";

const analyticsService = {
  async getVendorAnalytics() {
    try {
      const { data } = await api.get("/analytics/vendor");
      return data.analytics;
    } catch (error) {
      throw extractErrorMessage(error);
    }
  },
  async getAdminAnalytics() {
    try {
      const { data } = await api.get("/analytics/admin");
      return data.analytics;
    } catch (error) {
      throw extractErrorMessage(error);
    }
  },
};

export default analyticsService;
