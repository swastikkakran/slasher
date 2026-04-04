import { ApiError } from "../utilities/api-error.js";
import { asyncHandler } from "../utilities/async-handler.js";
import { tokenModel } from "../models/token.model.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const verify_refresh_JWT = asyncHandler(async function (req, res, next) {

    const oldToken = req.body.refreshToken
    if(!oldToken) throw new ApiError(401, "missing token!")

    //checking cryptographic authenticity and expiry of token
    let decode;
    try {
        decode = jwt.verify(oldToken, process.env.REFRESH_TOKEN_SECRET)
    } catch (error) {
        if (error.name === "TokenExpiredError") throw new ApiError(401, "expired refresh token!")
        throw new ApiError(401, "invalid refresh token!")
    }

    //checking if token is present in DB or not
    const oldHashedToken = crypto.createHash("sha256").update(oldToken).digest("hex")
    const existingToken = await tokenModel.findOne({ token: oldHashedToken })
    if (!existingToken) throw new ApiError(401, "Token has been revoked!")

    req.token = existingToken
    req.decodedToken = decode
    next()
})

export { verify_refresh_JWT }