import { Router } from "express";
import { shortenUrl } from "../controllers/url.controller.js";
import { verify_access_JWT } from "../middlewares/auth.middleware.js";
import { shortenUrlSchema } from "../validators/url.validator.js";
import { validateRequest } from "../middlewares/validate.middleware.js";

const router = Router();

router.route("/shorten").post(verify_access_JWT, validateRequest(shortenUrlSchema), shortenUrl)

export default router