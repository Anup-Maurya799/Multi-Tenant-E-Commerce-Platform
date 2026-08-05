import { Router } from "express";
import { stripeWebhook } from "../controllers/webhookController.js";

const router = Router();

// Raw-body parsing for this exact path is applied in app.js, BEFORE
// express.json() — see the comment there for why.
router.post("/stripe", stripeWebhook);

export default router;
