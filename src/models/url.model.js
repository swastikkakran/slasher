import mongoose, { Schema } from "mongoose";

const urlSchema = new Schema({
    originalUrl: {
        type: String,
        required: true
    },
    shortCode: {
        type: String,
        index: true,
        required: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    clicks: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    expiresAt: {
        type: Date
    }
}, { timestamps: true })

export const urlModel = mongoose.model("Url", urlSchema);