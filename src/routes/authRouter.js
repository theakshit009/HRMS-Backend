import express from "express"
import { changePassword, userLogin } from "../controller/auth.controller.js"
import { authMiddleware } from "../middleware/authMiddleware.js"

const authRouter = express.Router()

authRouter.post("/login", userLogin)
authRouter.post("/changePassword", authMiddleware, changePassword)

export default authRouter