import { ApiResponse } from "../utilities/api-response.js";
import { ApiError } from "../utilities/api-error.js";
import { asyncHandler } from "../utilities/async-handler.js";
import { urlModel } from "../models/url.model.js";
import { generateShortCode } from "../utilities/generate-shortcode.js";


const shortenUrl = asyncHandler(async function (req, res) {

    const { originalUrl, customCode, expiresAt } = req.body

    let urlShortCode;
    if (customCode) {
        const isCodeTaken = await urlModel.findOne({ shortCode: customCode })
        if (isCodeTaken) throw new ApiError(409, "shortCode is already in use!")
        urlShortCode = customCode;
    }
    else {
        let count = 5;
        let i = 0
        for (i; i < count; i++) {
            const code = generateShortCode()
            const isCodeTaken = await urlModel.findOne({ shortCode: code })
            if (isCodeTaken) continue
            urlShortCode = code;
            break;
        }
        if (!urlShortCode) throw new ApiError(500, "error occurred while generating short code!")
    }

    const createdUrl = await urlModel.create({ 
        originalUrl: originalUrl,
        shortCode: urlShortCode,
        owner: req.user._id,
        ...(expiresAt && { expiresAt: new Date(expiresAt) })
    })

    return res
        .status(201)
        .json(new ApiResponse(201, {
            shortUrl: `${process.env.BASE_URL}/${urlShortCode}`,
            url: createdUrl
        }))
})

export { shortenUrl }