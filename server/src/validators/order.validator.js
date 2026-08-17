import { body } from "express-validator";

export const createOrderValidator = [
  body("storeId").isMongoId().withMessage("Invalid store id."),
  body("items")
    .isArray({ min: 1 })
    .withMessage("Order must include at least one item."),
  body("items.*.productId").isMongoId().withMessage("Invalid product id."),
  body("items.*.quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be at least 1."),
  body("items.*.variantLabel")
    .optional({ nullable: true })
    .isString()
    .withMessage("variantLabel must be a string."),
];
