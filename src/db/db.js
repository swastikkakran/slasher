import mongoose from "mongoose";

const connectDB = async () => {

    try {
        await mongoose.connect(process.env.MONGO_URI)
        console.log("DB connected successfully!")

    } catch (error) {
        console.error("Couldn't connect to DB... ", error)
        process.exit(1)
    }
}

export { connectDB }