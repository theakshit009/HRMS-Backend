import express from 'express'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { applyLeave, approveLeave, getLeaveBalnce, myLeaves, pendingLeaves, rejectLeave } from '../controller/leave.controller.js'

const LeaveRouter = express.Router()

LeaveRouter.post('/apply', authMiddleware, applyLeave)

LeaveRouter.get('/myLeaves', authMiddleware, myLeaves)

LeaveRouter.get('/leaveBalance', authMiddleware, getLeaveBalnce)

LeaveRouter.post('/approve', authMiddleware, approveLeave)

LeaveRouter.post('/reject', authMiddleware, rejectLeave)

LeaveRouter.get('/pending', authMiddleware, pendingLeaves)

export default LeaveRouter