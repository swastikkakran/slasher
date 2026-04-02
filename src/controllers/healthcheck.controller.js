import { ApiResponse } from "../utilities/api-response.js";
import { asyncHandler } from "../utilities/async-handler.js";

const healthCheckController = asyncHandler(async function (req, res) {
    res.status(200).json(new ApiResponse(200, null, "healthcheck route is working..."))
})

export { healthCheckController }