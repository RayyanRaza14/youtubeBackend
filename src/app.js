import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"


const app  = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({
    limit: "16kb"
}))
app.use(express.urlencoded({
    extended: true,
    limit: "16kb"
}))
app.use(express.static("public"))
app.use(cookieParser())


//router import
import userRouter from "./routes/user.route.js"
import videoRouter from './routes/video.route.js'


app.use("/api/v1/users", userRouter)
app.use("/api/v1/videos", videoRouter)

export default app