import express, { json, urlencoded } from "express";
import cors from "cors";
//route imports
import healthCheckRouter from "./routes/healthcheck.route.js"

const app = express();

//express config
app.use(json({ limit: "16kb" }))
app.use(urlencoded({extended: true, limit: "16kb" }))

//cors config, will complete later
app.use(cors())

app.get("/", (req, res) => {res.send("welcome!")})

//healthcheck router
app.use("/healthcheck", healthCheckRouter)


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