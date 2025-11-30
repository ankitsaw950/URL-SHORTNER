import express from "express";
import { getAnalytics } from "../controllers/analytics.controller.js";

const router = express.Router();

// GET analytics for any short code
router.get("/:code", getAnalytics);

export default router;
