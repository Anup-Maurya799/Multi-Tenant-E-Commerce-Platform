import { api, extractErrorMessage } from "./authService";

const storeService = {
  /** Public storefront browsing — no auth required. */
  async listStores(params = {}) {
    try {
      const { data } = await api.get("/stores", { params });
      return data;
    } catch (error) {
      throw extractErrorMessage(error);
    }
  },
  async getStoreBySlug(slug) {
    try {
      const { data } = await api.get(`/stores/slug/${slug}`);
      return data;
    } catch (error) {
      throw extractErrorMessage(error);
    }
  },
  async createStore(payload) {
    try {
      const { data } = await api.post("/stores", payload);
      return data;
    } catch (error) {
      throw extractErrorMessage(error);
    }
  },
  async getMyStore() {
    try {
      const { data } = await api.get("/stores/me");
      return data;
    } catch (error) {
      if (error.response?.status === 404) return { store: null };
      throw extractErrorMessage(error);
    }
  },
  async updateStore(storeId, updates) {
    try {
      const { data } = await api.patch(`/stores/${storeId}`, updates);
      return data;
    } catch (error) {
      throw extractErrorMessage(error);
    }
  },
  async uploadLogo(storeId, file) {
    try {
      const formData = new FormData();
      formData.append("logo", file);
      const { data } = await api.post(`/stores/${storeId}/logo`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    } catch (error) {
      throw extractErrorMessage(error);
    }
  },
};

export default storeService;
