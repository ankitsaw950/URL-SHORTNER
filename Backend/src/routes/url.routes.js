import express from "express";

import { createUrl, redirectUrl } from "../controllers/url.controller.js";

const router = express.Router();

router.post("/create", createUrl);
router.get("/:code", redirectUrl);

export default router;