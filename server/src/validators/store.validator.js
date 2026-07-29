import { body, param } from "express-validator";

export const createStoreValidator = [
  body("name").trim().notEmpty().withMessage("Store name is required."),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must be under 500 characters."),
  body("logoUrl")
    .optional()
    .trim()
    .isURL()
    .withMessage("Logo URL must be a valid URL."),
];

export const updateStoreValidator = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Store name cannot be empty."),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must be under 500 characters."),
  body("logoUrl")
    .optional()
    .trim()
    .isURL()
    .withMessage("Logo URL must be a valid URL."),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be true or false."),
];

export const storeIdParamValidator = [
  param("storeId").isMongoId().withMessage("Invalid store id."),
];

export const storeSlugParamValidator = [
  param("slug").trim().notEmpty().withMessage("Store slug is required."),
];
