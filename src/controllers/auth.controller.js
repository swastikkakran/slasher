import { ApiResponse } from "../utilities/api-response.js";
import { ApiError } from "../utilities/api-error.js";
import { asyncHandler } from "../utilities/async-handler.js";
import { userModel } from "../models/user.model.js";
import { tokenModel } from "../models/token.model.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const generateAccessAndRefreshToken = async function(userId) {
    try {
        const user = await userModel.findById(userId)
        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()

        const hashedToken = crypto.createHash("sha256").update(refreshToken).digest("hex")
        const tokenDoc = await tokenModel.create({
            token: hashedToken,
            userId: user._id,
            expiresAt: new Date((1000*60*60*24*7) + Date.now())
        })
        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Error generating tokens")
    }
}

const registerUser = asyncHandler(async function (req, res) {

    const { username, email, password } = req.body

    //checking if user exists
    const isUserAlreadyPresent = await userModel.findOne({ $or: [{ username: username }, {email: email}] })

    if (isUserAlreadyPresent) {
        throw new ApiError(409, "username or email already exists!")
    }

    //creating new user
    const newUser = await userModel.create({
        username: username,
        email: email,
        password: password
    })

    //checking if user has been created
    const user = await userModel.findById(newUser._id).select("-password")

    if (!user) {
        throw new ApiError(400, "error occured registering user..")
    }

    return res
        .status(201)
        .json(new ApiResponse(201, {user: user}, "user registered successfully!"))

})


const loginUser = asyncHandler(async function(req, res) {
    const { identifier, password } = req.body

    //checking if user exists
    const existingUser = await userModel.findOne({
        $or: [{email: identifier}, {username: identifier}]
    })

    if (!existingUser) {
        throw new ApiError(401, "invalid credentials!", [])
    }

    //checking password
    const validPassword = await existingUser.isPasswordCorrect(password)

    if (!validPassword) {
        throw new ApiError(401, "invalid credentials!", [])
    }

    //generating tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(existingUser._id)

    //preparing user data to send over json
    const loggedUser = existingUser.toObject()
    delete loggedUser.password

    return res
        .status(200)
        .json(new ApiResponse(200,
            {
                success: true,
                data: {
                    "accessToken": accessToken,
                    "refreshToken": refreshToken
                },
                user: loggedUser
            },
            "user logged in successfully!")
        )
})


const refreshUser = asyncHandler(async function (req, res) {
    
    const existingToken = req.token
    const decode = req.decodedToken
    await tokenModel.findByIdAndDelete(existingToken._id)

    //assigning new tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(decode._id)

    return res
        .status(200)
        .json(new ApiResponse(200, {
            success: true,
            "accessToken": accessToken,
            "refreshToken": refreshToken
        }))

})


const logoutUser = asyncHandler(async function (req, res) {
    
    const token = req.token;
    await tokenModel.findByIdAndDelete(token._id)

    return res
        .status(200)
        .json(new ApiResponse(200, { "success": true }, "user logged out successfully!"))
})

export { registerUser, loginUser, refreshUser, logoutUser }