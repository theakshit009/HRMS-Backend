import express from 'express'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { checkAttendanceTime, officeIpCheck } from '../middleware/attendanceMiddleware.js'
import { checkoutEmployee, markAttendanceByFace, markAttendanceByHR } from '../controller/attendance.controller.js'

const AttendaceRouter = express.Router()

AttendaceRouter.post('/mark-by-face', authMiddleware, checkAttendanceTime, officeIpCheck, markAttendanceByFace)

AttendaceRouter.post('/mark-by-hr', authMiddleware, officeIpCheck, markAttendanceByHR)

AttendaceRouter.post('/checkout', authMiddleware, officeIpCheck, checkoutEmployee)

export default AttendaceRouter