import express from "express";

const router = express.Router();

// Placeholder route
router.get("/", (req, res) => {
  res.json({
    message: "Order routes not implemented yet.",
  });
});

export default router;
