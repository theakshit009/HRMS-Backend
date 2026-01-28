import express from "express"
import "dotenv/config"
import cors from "cors"
import { connectDB } from "./config/db.js"
import hrRouter from "./routes/hrRoutes.js"
import authRoter from "./routes/authRouter.js"
import AttendaceRouter from "./routes/attendanceRoutes.js"
import "./utils/markAbsent.js"
import LeaveRouter from "./routes/leaveRoutes.js"

const app = express()

app.use(cors())
app.use(express.json())

const PORT = process.env.PORT

connectDB()

app.use("/api/v1/hr", hrRouter)
app.use("/api/v1/auth", authRoter)
app.use("/api/v1/attendance", AttendaceRouter)
app.use("/api/v1/leave", LeaveRouter)

app.listen(PORT, () => {
    console.log("Server Started Successfully")
})