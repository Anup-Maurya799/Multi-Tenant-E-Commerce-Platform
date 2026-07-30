import { asyncHandler } from "../middleware/errorHandler.js";
import * as productService from "../services/product.service.js";

export const createProduct = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.user, req.body);
  res.status(201).json({ message: "Product created successfully.", product });
});

export const listProducts = asyncHandler(async (req, res) => {
  const result = await productService.listProducts(req.query);
  res.json(result);
});

export const listMyProducts = asyncHandler(async (req, res) => {
  const result = await productService.listMyProducts(req.user, req.query);
  res.json(result);
});

export const getProduct = asyncHandler(async (req, res) => {
  // req.user may be undefined on this public route (no requireAuth) — fine,
  // getProductById treats an absent user as "not the owner."
  const product = await productService.getProductById(
    req.params.productId,
    req.user,
  );
  res.json({ product });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(
    req.user,
    req.params.productId,
    req.body,
  );
  res.json({ message: "Product updated successfully.", product });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const result = await productService.deleteProduct(
    req.user,
    req.params.productId,
  );
  res.json(result);
});

export const uploadProductImages = asyncHandler(async (req, res) => {
  const product = await productService.addProductImages(
    req.user,
    req.params.productId,
    req.files,
  );
  res.status(201).json({ message: "Images uploaded successfully.", product });
});

export const deleteProductImage = asyncHandler(async (req, res) => {
  const product = await productService.removeProductImage(
    req.user,
    req.params.productId,
    Number(req.params.imageIndex),
  );
  res.json({ message: "Image removed successfully.", product });
});
