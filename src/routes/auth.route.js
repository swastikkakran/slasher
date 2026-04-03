import { Router } from "express";
import { registerUser, loginUser } from "../controllers/auth.controller";
import { validateRequest } from "../middlewares/validate.middleware.js";
import { registerSchema, loginSchema } from "../validators/auth.validator.js";

const router = Router();

router.route("/register").post(validateRequest(registerSchema), registerUser)
router.route("/login").post(validateRequest(loginSchema), loginUser)

export default router