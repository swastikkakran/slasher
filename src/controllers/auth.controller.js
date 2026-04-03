import { ApiResponse } from "../utilities/api-response.js";
import { ApiError } from "../utilities/api-error.js";
import { asyncHandler } from "../utilities/async-handler.js";
import { userModel } from "../models/user.model.js"
import { tokenModel } from "../models/token.model.js"
import bcrypt from "bcrypt";

const generateAccessAndRefreshToken = async function(userId) {
    try {
        const user = await userModel.findById(userId)
    
        if (!user) {
            throw new ApiError(404, "user not found!", [])
        }
        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()
        const hashedToken = await bcrypt.hash(refreshToken, 10)
        const tokenDoc = await tokenModel.create({
            token: hashedToken,
            userId: user._id,
            expiresAt: (1000*60*60*24*7) + Date.now()
        })
        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Error generating tokens,")
    }
}

const registerUser = asyncHandler(async function (req, res) {

    const { username, email, password } = req.body

    //checking if user exists
    isUserAlreadyPresent = userModel.findOne({ $or: [{ username: username }, {email: email}] })

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



export {registerUser}