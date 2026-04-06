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


const getUrls = asyncHandler(async function (req, res) {

    const page = parseInt(req.query.page)
    const limit = Math.min(parseInt(req.query.limit) || 10, 50)
    const skip = (page - 1)*limit
    const sort = req.query.sort || "createdAt"
    const order = req.query.order === "asc" ? 1 : -1

    const urls = await urlModel.find({ owner: req.user._id }).sort({ [sort]: order }).limit(limit).skip(skip)
    const totalDocs = await urlModel.countDocuments({ owner: req.user._id })

    const totalPages = Math.ceil(totalDocs/limit)

    return res
        .status(200)
        .json(new ApiResponse(200, {
            data: {
                urls: urls,
                pagination: { total: totalDocs, page: page, limit: limit, totalPages: totalPages }
            },
            "success": true
        }))

})


const getSingleUrl = asyncHandler(async function (req, res) {
    
    const url = await urlModel.findOne({ owner: req.user._id, shortCode: req.params.shortCode })
    if (!url) throw new ApiError(404, "URL not found!")

    return res
        .status(200)
        .json(new ApiResponse((200), {
            data: {
                url: url
            },
            "success": true
        }))
})

export { shortenUrl, getUrls, getSingleUrl }