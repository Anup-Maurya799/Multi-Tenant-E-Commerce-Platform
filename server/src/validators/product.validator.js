import { body, param, query } from "express-validator";

const variantValidator = body("variants")
  .optional()
  .isArray()
  .withMessage("Variants must be an array");

export const createProductValidator = [
  body("name").trim().notEmpty().withMessage("Product name is required."),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Description must be under 2000 characters."),
  body("price")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number."),
  body("stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer."),
  body("images")
    .optional()
    .isArray()
    .withMessage("Images must be an array of URLs."),
  variantValidator,
];

export const updateProductValidator = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Product name cannot be empty."),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Description must be under 2000 characters."),
  body("price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number."),
  body("stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer."),
  body("images")
    .optional()
    .isArray()
    .withMessage("Images must be an array of URLs."),
  body("isPublished")
    .optional()
    .isBoolean()
    .withMessage("isPublished must be true or false."),
  variantValidator,
];

export const productIdParamValidator = [
  param("productId").isMongoId().withMessage("Invalid product id."),
];

export const imageIndexParamValidator = [
  param("productId").isMongoId().withMessage("Invalid product id."),
  param("imageIndex").isInt({ min: 0 }).withMessage("Invalid image index."),
];

export const listProductsQueryValidator = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("page must be a positive integer."),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("limit must be between 1 and 100."),
  query("search").optional().trim(),
  query("storeId").optional().isMongoId().withMessage("Invalid storeId."),
];
