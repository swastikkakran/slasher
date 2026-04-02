import express, { json, urlencoded } from "express";
import cors from "cors";

const app = express();

//express config
app.use(json({ limit: "16kb" }))
app.use(urlencoded({extended: true, limit: "16kb" }))

//cors config, will complete later
app.use(cors())

app.get("/", (req, res) => {res.send("welcome!")})

export { app }