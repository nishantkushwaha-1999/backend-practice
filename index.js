import dotenv from "dotenv"
import app from "./app.js";
import connectDB from "./db/index.js";

dotenv.config({
    path: './.env'
})



connectDB()
.then(() => {
    const PORT = process.env.PORT || 8000
    app.listen(PORT, () => {
        console.log(`⚙️ Server is running on PORT: ${PORT} \n      https://localhost:${PORT}`)
    })
})
.catch((err) => {
    console.log("MongoDB Connection Failed !!! ", err)
});