import { Router } from "express";
import { shortenUrl } from "../controllers/url.controller.js";
import { verifyJWT } from "../middlewares/jwt.middleware.js";
import { shortenUrlSchema } from "../validators/url.validator.js";
import { validateRequest } from "../middlewares/validate.middleware.js";

const router = Router();

router.route("/shorten").post(verifyJWT, validateRequest(shortenUrlSchema), shortenUrl)

export default router