import { api, extractErrorMessage } from "./authService";

const productService = {
  async listMyProducts(params = {}) {
    try {
      const { data } = await api.get("/products/vendor/mine", { params });
      return data;
    } catch (error) {
      throw extractErrorMessage(error);
    }
  },
  async getProduct(productId) {
    try {
      const { data } = await api.get(`/products/${productId}`);
      return data;
    } catch (error) {
      throw extractErrorMessage(error);
    }
  },
  async createProduct(payload) {
    try {
      const { data } = await api.post("/products", payload);
      return data;
    } catch (error) {
      throw extractErrorMessage(error);
    }
  },
  async updateProduct(productId, updates) {
    try {
      const { data } = await api.patch(`/products/${productId}`, updates);
      return data;
    } catch (error) {
      throw extractErrorMessage(error);
    }
  },
  async deleteProduct(productId) {
    try {
      const { data } = await api.delete(`/products/${productId}`);
      return data;
    } catch (error) {
      throw extractErrorMessage(error);
    }
  },
  async uploadImages(productId, files) {
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append("images", file));
      const { data } = await api.post(
        `/products/${productId}/images`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      return data;
    } catch (error) {
      throw extractErrorMessage(error);
    }
  },
  async deleteImage(productId, imageIndex) {
    try {
      const { data } = await api.delete(
        `/products/${productId}/images/${imageIndex}`,
      );
      return data;
    } catch (error) {
      throw extractErrorMessage(error);
    }
  },
};

export default productService;
