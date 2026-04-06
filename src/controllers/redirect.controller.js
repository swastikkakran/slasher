import { ApiError } from "../utilities/api-error.js";
import { asyncHandler } from "../utilities/async-handler.js";
import { urlModel } from "../models/url.model.js";

const redirect = asyncHandler(async function (req, res) {
    
    const shortCode = req.params.shortCode

    const url = await urlModel.findOne({ shortCode: shortCode })
    if (!url) throw new ApiError(404, "url not found!")
    if (url.isActive === false) throw new ApiError(410, "url is not active!")
    const isUrlExpired = url.expiresAt && url.expiresAt < new Date()
    if (isUrlExpired) throw new ApiError(410, "url has expired!")

    const incrementClick = urlModel.findByIdAndUpdate(url._id, { $inc: { clicks: 1 } })
    res.redirect(url.originalUrl)
})