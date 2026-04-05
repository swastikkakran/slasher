import { z } from "zod";

const shortenUrlSchema = z.object({
    originalUrl: z
        .url(),
    shortCode: z
        .string()
        .min(3, "short code must be atleast 3 characters long")
        .regex(/^[a-zA-Z0-9]+$/, "Username can only contain letters, and numbers")
        .optional(),
    expiresAt: z
        .string()
        .datetime()
        .refine(
            date => new Date(date) > new Date(), 
            "expiresAt must be in the future"
        )
        .optional()
})

export { shortenUrlSchema }