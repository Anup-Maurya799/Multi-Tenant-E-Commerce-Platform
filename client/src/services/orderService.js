import { api, extractErrorMessage } from "./authService";

const orderService = {
  /** @param {{ storeId: string, items: Array }} payload */
  async createOrder(payload) {
    try {
      const { data } = await api.post("/orders", payload);
      return data; // { order, clientSecret }
    } catch (error) {
      throw extractErrorMessage(error);
    }
  },

  async getMyOrders() {
    try {
      const { data } = await api.get("/orders/mine");
      return data;
    } catch (error) {
      throw extractErrorMessage(error);
    }
  },

  async getVendorOrders() {
    try {
      const { data } = await api.get("/orders/vendor/mine");
      return data;
    } catch (error) {
      throw extractErrorMessage(error);
    }
  },

  /**
   * DEMO/MOCK MODE ONLY — this endpoint does not exist on the real backend.
   * Real payment confirmation happens via Stripe's own SDK (stripe.confirmPayment),
   * not through our API. This exists purely so checkout is demoable without
   * real Stripe keys — see src/mocks/mockAdapter.js.
   */
  async simulateMockPayment(orderId) {
    try {
      const { data } = await api.post(`/orders/${orderId}/simulate-payment`);
      return data;
    } catch (error) {
      throw extractErrorMessage(error);
    }
  },
};

export default orderService;
