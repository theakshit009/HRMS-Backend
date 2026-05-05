import express from "express"
import "dotenv/config"
import cors from "cors"
import { createServer } from "http"
import { Server } from "socket.io"
import { connectDB } from "./config/db.js"
import hrRouter from "./routes/hrRoutes.js"
import authRoter from "./routes/authRouter.js"
import AttendaceRouter from "./routes/attendanceRoutes.js"
import dashboardRouter from "./routes/dashboardRoutes.js"
import "./utils/markAbsent.js"
import LeaveRouter from "./routes/leaveRoutes.js"

const app = express()
app.set('trust proxy', true)
const httpServer = createServer(app)

const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
})

// Attach io to app so controllers can emit events via req.app.get('io')
app.set("io", io)

io.on("connection", (socket) => {
    console.log("A client connected to Socket.io:", socket.id)
    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id)
    })
})

app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 5000

await connectDB()

app.use("/api/v1/hr", hrRouter)
app.use("/api/v1/auth", authRoter)
app.use("/api/v1/attendance", AttendaceRouter)
app.use("/api/v1/dashboard", dashboardRouter)
app.use("/api/v1/leave", LeaveRouter)

httpServer.listen(PORT, () => {
    console.log(`Server Started Successfully on port ${PORT}`)
})