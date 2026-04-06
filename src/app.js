import express, { json, urlencoded } from "express";
import cors from "cors";
//route imports
import healthCheckRouter from "./routes/healthcheck.route.js"
import authRouter from "./routes/auth.route.js"
import urlRouter from "./routes/url.route.js"
//redirect controller
import { redirect } from "./controllers/redirect.controller.js";

const app = express();

//express config
app.use(json({ limit: "16kb" }))
app.use(urlencoded({extended: true, limit: "16kb" }))

//cors config, will complete later
app.use(cors())

app.get("/", (req, res) => {res.send("welcome!")})

//redirect route
app.get("/:shortCode", redirect)

//healthcheck routes
app.use("/healthcheck", healthCheckRouter)

//auth routes
app.use("/api/v1/auth", authRouter)

//url routes
app.use("api/v1/urls", urlRouter)


app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500
    res.status(statusCode).json({
        success: false,
        statusCode,
        message: err.message || "something went wrong",
        errors: err.errors || []
    })
})

export { app }