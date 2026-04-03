import { z } from "zod";

const registerSchema = z.object({
    username: z
        .string()
        .min(3, "Username must be at least 3 characters")
        .max(20, "Username must be at most 20 characters")
        .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
    email: z
        .string()
        .email("Invalid email format"),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(/^(?=.*[A-Z])(?=.*\d).+$/, "Password must contain at least 1 uppercase letter and 1 number")
});

const loginSchema = z.object({
    identifier: z
        .string()
        .min(1, "Email or username is required"),
    password: z
        .string()
        .min(1, "Password is required")
});

export { registerSchema, loginSchema }