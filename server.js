import dotenv from "dotenv";
import { app } from "./src/app.js";
import { connectDB } from "./src/db/db.js"

dotenv.config({ path: "./.env" })

const port = process.env.PORT || 3000

connectDB()
.then(() => {
    app.listen(port, () => {
        console.log(`app is running on http://localhost:${port}`)
    })
})
.catch((err) => {
    console.error("error running the app. check db connection", err)
    process.exit(1)
})
