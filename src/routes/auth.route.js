import { Router } from "express";
import { registerUser, loginUser, refreshUser } from "../controllers/auth.controller.js";
import { validateRequest } from "../middlewares/validate.middleware.js";
import { registerSchema, loginSchema } from "../validators/auth.validator.js";

const router = Router();

router.route("/register").post(validateRequest(registerSchema), registerUser)
router.route("/login").post(validateRequest(loginSchema), loginUser)
router.route("/refresh").post(refreshUser)

export default router