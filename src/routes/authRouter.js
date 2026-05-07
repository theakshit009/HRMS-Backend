import express from "express"
import { changePassword, forgotPassword, resetPassword, userLogin } from "../controller/auth.controller.js"
import { authMiddleware } from "../middleware/authMiddleware.js"

const authRouter = express.Router()

authRouter.post("/login", userLogin)
authRouter.post("/changePassword", authMiddleware, changePassword)
authRouter.post("/forgot-password", forgotPassword)
authRouter.post("/reset-password", resetPassword)

export default authRouter