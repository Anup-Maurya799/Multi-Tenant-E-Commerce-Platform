import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import storeService from "../../services/storeService";

const initialState = {
  myStore: null, // null means "not loaded yet" OR "vendor has no store" — see hasStore below
  status: "idle", // idle | loading | succeeded | failed
  error: null,
};

export const fetchMyStore = createAsyncThunk(
  "store/fetchMine",
  async (_, { rejectWithValue }) => {
    try {
      const data = await storeService.getMyStore();
      return data.store; // may be null — that's the onboarding signal, not an error
    } catch (errorMessage) {
      return rejectWithValue(errorMessage);
    }
  },
);

export const createStore = createAsyncThunk(
  "store/create",
  async (payload, { rejectWithValue }) => {
    try {
      const data = await storeService.createStore(payload);
      return data.store;
    } catch (errorMessage) {
      return rejectWithValue(errorMessage);
    }
  },
);

export const updateStore = createAsyncThunk(
  "store/update",
  async ({ storeId, updates }, { rejectWithValue }) => {
    try {
      const data = await storeService.updateStore(storeId, updates);
      return data.store;
    } catch (errorMessage) {
      return rejectWithValue(errorMessage);
    }
  },
);

export const uploadStoreLogo = createAsyncThunk(
  "store/uploadLogo",
  async ({ storeId, file }, { rejectWithValue }) => {
    try {
      const data = await storeService.uploadLogo(storeId, file);
      return data.store;
    } catch (errorMessage) {
      return rejectWithValue(errorMessage);
    }
  },
);

const storeSlice = createSlice({
  name: "store",
  initialState,
  reducers: {
    clearStoreError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyStore.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchMyStore.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.myStore = action.payload; // null if vendor hasn't created one yet
      })
      .addCase(fetchMyStore.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(createStore.fulfilled, (state, action) => {
        state.myStore = action.payload;
      })
      .addCase(updateStore.fulfilled, (state, action) => {
        state.myStore = action.payload;
      })
      .addCase(uploadStoreLogo.fulfilled, (state, action) => {
        state.myStore = action.payload;
      });
  },
});

export const { clearStoreError } = storeSlice.actions;
export default storeSlice.reducer;
