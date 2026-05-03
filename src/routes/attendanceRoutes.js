import express from 'express'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { checkAttendanceTime, officeIpCheck } from '../middleware/attendanceMiddleware.js'
import { checkoutEmployee, getAttendanceByMonth, getTodayStatus, markAttendanceByFace, markAttendanceByHR, getAllAttendance } from '../controller/attendance.controller.js'

const AttendaceRouter = express.Router()

AttendaceRouter.post('/mark-by-face', authMiddleware, checkAttendanceTime, officeIpCheck, markAttendanceByFace)

AttendaceRouter.post('/mark-by-hr', authMiddleware, officeIpCheck, markAttendanceByHR)

AttendaceRouter.post('/checkout', authMiddleware, officeIpCheck, checkoutEmployee)

AttendaceRouter.get('/monthly', authMiddleware, getAttendanceByMonth)

AttendaceRouter.get('/today-status', authMiddleware, getTodayStatus)

AttendaceRouter.get('/all', authMiddleware, getAllAttendance)

export default AttendaceRouter