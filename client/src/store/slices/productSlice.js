import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import productService from "../../services/productService";

const initialState = {
  items: [],
  total: 0,
  page: 1,
  pages: 1,
  status: "idle", // idle | loading | succeeded | failed
  error: null,
  mutationStatus: "idle", // separate from list-loading status, for create/update/delete spinners
};

export const fetchMyProducts = createAsyncThunk(
  "products/fetchMine",
  async (params, { rejectWithValue }) => {
    try {
      return await productService.listMyProducts(params);
    } catch (errorMessage) {
      return rejectWithValue(errorMessage);
    }
  },
);

export const createProduct = createAsyncThunk(
  "products/create",
  async (payload, { rejectWithValue }) => {
    try {
      const data = await productService.createProduct(payload);
      return data.product;
    } catch (errorMessage) {
      return rejectWithValue(errorMessage);
    }
  },
);

export const updateProduct = createAsyncThunk(
  "products/update",
  async ({ productId, updates }, { rejectWithValue }) => {
    try {
      const data = await productService.updateProduct(productId, updates);
      return data.product;
    } catch (errorMessage) {
      return rejectWithValue(errorMessage);
    }
  },
);

export const deleteProduct = createAsyncThunk(
  "products/delete",
  async (productId, { rejectWithValue }) => {
    try {
      await productService.deleteProduct(productId);
      return productId;
    } catch (errorMessage) {
      return rejectWithValue(errorMessage);
    }
  },
);

export const uploadProductImages = createAsyncThunk(
  "products/uploadImages",
  async ({ productId, files }, { rejectWithValue }) => {
    try {
      const data = await productService.uploadImages(productId, files);
      return data.product;
    } catch (errorMessage) {
      return rejectWithValue(errorMessage);
    }
  },
);

export const deleteProductImage = createAsyncThunk(
  "products/deleteImage",
  async ({ productId, imageIndex }, { rejectWithValue }) => {
    try {
      const data = await productService.deleteImage(productId, imageIndex);
      return data.product;
    } catch (errorMessage) {
      return rejectWithValue(errorMessage);
    }
  },
);

function upsertProductInList(state, updatedProduct) {
  const index = state.items.findIndex((p) => p._id === updatedProduct._id);
  if (index !== -1) state.items[index] = updatedProduct;
}

const productSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    clearProductError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ---- list ----
      .addCase(fetchMyProducts.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchMyProducts.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload.products;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.pages = action.payload.pages;
      })
      .addCase(fetchMyProducts.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      // ---- create ----
      .addCase(createProduct.pending, (state) => {
        state.mutationStatus = "loading";
        state.error = null;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.mutationStatus = "succeeded";
        state.items.unshift(action.payload);
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.error = action.payload;
      })

      // ---- update / image mutations all just replace the one product in the list ----
      .addCase(updateProduct.fulfilled, (state, action) =>
        upsertProductInList(state, action.payload),
      )
      .addCase(uploadProductImages.fulfilled, (state, action) =>
        upsertProductInList(state, action.payload),
      )
      .addCase(deleteProductImage.fulfilled, (state, action) =>
        upsertProductInList(state, action.payload),
      )

      // ---- delete ----
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.items = state.items.filter((p) => p._id !== action.payload);
      });
  },
});

export const { clearProductError } = productSlice.actions;
export default productSlice.reducer;
