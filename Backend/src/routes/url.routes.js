import express from "express";

import { createUrl, redirectUrl } from "../controllers/url.controller.js";

import rateLimiter from "../middleware/rateLimiter.js";

const router = express.Router();

router.post("/create", createUrl);
router.get("/:code", rateLimiter(5, 60), redirectUrl);

export default router;
