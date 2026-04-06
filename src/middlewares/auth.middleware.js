import { ApiError } from "../utilities/api-error.js";
import { asyncHandler } from "../utilities/async-handler.js";
import { userModel } from "../models/user.model.js";
import { tokenModel } from "../models/token.model.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";

const verify_access_JWT = asyncHandler(async function (req, res, next) {
    const requestHeader = req.headers['authorization']

    if(!requestHeader) throw new ApiError(401, "token required!");

    const token = requestHeader.replace("Bearer ", "")
    let decode;

    try {
        decode = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    } catch (error) {
        if (error.name === "TokenExpiredError") throw new ApiError(401, "expired access token!")
        throw new ApiError(401, "invalid access token!")
    }

    const existingUser = await userModel.findById(decode._id).select("-password")

    if (!existingUser) throw new ApiError(401, "invalid token!")

    req.user = existingUser
    next()
})

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

export { verify_access_JWT, verify_refresh_JWT }