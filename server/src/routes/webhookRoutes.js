import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    message: "Webhook routes not implemented yet.",
  });
});

export default router;
