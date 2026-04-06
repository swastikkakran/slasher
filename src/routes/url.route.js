import { Router } from "express";
import { shortenUrl, getUrls, getSingleUrl, updateUrl, deleteUrl } from "../controllers/url.controller.js";
import { verify_access_JWT } from "../middlewares/auth.middleware.js";
import { shortenUrlSchema } from "../validators/url.validator.js";
import { validateRequest } from "../middlewares/validate.middleware.js";

const router = Router();

router.route("/").get(verify_access_JWT, getUrls)
router.route("/shorten").post(verify_access_JWT, validateRequest(shortenUrlSchema), shortenUrl)
router.route("/:shortCode").get(verify_access_JWT, getSingleUrl)
router.route("/:shortCode").patch(verify_access_JWT, updateUrl)
router.route("/:shortCode").delete(verify_access_JWT, deleteUrl)

export default router