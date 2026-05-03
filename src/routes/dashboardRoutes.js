import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { getHRDashboardStats } from '../controller/dashboard.controller.js';

const dashboardRouter = express.Router();

dashboardRouter.get('/hr-stats', authMiddleware, getHRDashboardStats);

export default dashboardRouter;
