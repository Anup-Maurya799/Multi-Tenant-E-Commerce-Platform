import { asyncHandler } from "../middleware/errorHandler.js";
import * as storeService from "../services/store.service.js";

export const createStore = asyncHandler(async (req, res) => {
  const store = await storeService.createStore(req.user, req.body);
  res.status(201).json({ message: "Store created successfully.", store });
});

export const getMyStore = asyncHandler(async (req, res) => {
  const store = await storeService.getMyStore(req.user);
  res.json({ store });
});

export const getStoreBySlug = asyncHandler(async (req, res) => {
  const store = await storeService.getStoreBySlug(req.params.slug);
  res.json({ store });
});

export const listStores = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await storeService.listActiveStores({ page, limit });
  res.json(result);
});

export const updateStore = asyncHandler(async (req, res) => {
  const store = await storeService.updateStore(
    req.user,
    req.params.storeId,
    req.body,
  );
  res.json({ message: "Store updated successfully.", store });
});

export const uploadStoreLogo = asyncHandler(async (req, res) => {
  const store = await storeService.updateStoreLogo(
    req.user,
    req.params.storeId,
    req.file,
  );
  res.json({ message: "Store logo updated successfully.", store });
});
