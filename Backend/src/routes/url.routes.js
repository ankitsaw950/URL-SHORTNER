import express from "express";

import { createUrl, redirectUrl } from "../controllers/url.controller.js";

import rateLimiter from "../middleware/rateLimiter.js";

const router = express.Router();

router.post("/create", rateLimiter(5, 60), createUrl);
router.get("/:code", redirectUrl);

export default router;
