import { ApiError } from "../utilities/api-error.js";
import { asyncHandler } from "../utilities/async-handler.js";
import { userModel } from "../models/user.model.js";
import jwt from "jsonwebtoken";

const verifyJWT = asyncHandler(async function (req, res, next) {
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

export { verifyJWT }