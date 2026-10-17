import express from 'express'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { checkAttendanceTime, officeIpCheck } from '../middleware/attendanceMiddleware.js'
import { checkoutEmployee, getAttendanceByMonth, getTodayStatus, markAttendanceByFace, markAttendanceByHR, getAllAttendance } from '../controller/attendance.controller.js'
import { getAttendanceSettings, updateAttendanceSettings, resetAttendanceSettings, preCheckAttendance } from '../controller/attendanceSettings.controller.js'

const AttendaceRouter = express.Router()

// Pre-check endpoint for employees
AttendaceRouter.get('/pre-check', authMiddleware, preCheckAttendance)

// Settings endpoints
AttendaceRouter.get('/settings', authMiddleware, getAttendanceSettings)
AttendaceRouter.put('/settings', authMiddleware, updateAttendanceSettings)
AttendaceRouter.post('/settings/reset', authMiddleware, resetAttendanceSettings)

AttendaceRouter.post('/mark-by-face', authMiddleware, checkAttendanceTime, officeIpCheck, markAttendanceByFace)

AttendaceRouter.post('/mark-by-hr', authMiddleware, officeIpCheck, markAttendanceByHR)

AttendaceRouter.post('/checkout', authMiddleware, officeIpCheck, checkoutEmployee)

AttendaceRouter.get('/monthly', authMiddleware, getAttendanceByMonth)

AttendaceRouter.get('/today-status', authMiddleware, getTodayStatus)

AttendaceRouter.get('/all', authMiddleware, getAllAttendance)

export default AttendaceRouter