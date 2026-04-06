import { Router } from "express";
import { registerUser, loginUser, refreshUser, logoutUser } from "../controllers/auth.controller.js";
import { validateRequest } from "../middlewares/validate.middleware.js";
import { verify_refresh_JWT } from "../middlewares/auth.middleware.js";
import { registerSchema, loginSchema } from "../validators/auth.validator.js";

const router = Router();

router.route("/register").post(validateRequest(registerSchema), registerUser)
router.route("/login").post(validateRequest(loginSchema), loginUser)
router.route("/refresh").post(verify_refresh_JWT, refreshUser)
router.route("/logout").post(verify_refresh_JWT, logoutUser)

export default router