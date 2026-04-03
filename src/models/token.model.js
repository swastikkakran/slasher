import mongoose, { Schema } from "mongoose";

const tokenSchema = new Schema({
    token: {
        type: String,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    expiresAt: {
        type: Date,
        required: true
    }
}, { timestamps: true })

tokenSchema.index({ token: 1 });
tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const tokenModel = mongoose.model("Token", tokenSchema)