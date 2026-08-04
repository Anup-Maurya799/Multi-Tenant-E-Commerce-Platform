import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    message: "Analytics routes not implemented yet.",
  });
});

export default router;
