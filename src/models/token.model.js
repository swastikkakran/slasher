import mongoose, { Schema } from "mongoose";

const tokenSchema = new Schema({
    token: String,
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    expiresAt: Date
}, { timestamps: true })

export const tokenModel = mongoose.model("Token", tokenSchema)