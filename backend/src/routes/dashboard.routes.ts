import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';

const router = Router();
const dashboardController = new DashboardController();

// Routes
router.get('/', dashboardController.getDashboard); // Main dashboard endpoint
router.get('/stats', dashboardController.getStats);
router.get('/summary', dashboardController.getSummary);
router.get('/metrics', dashboardController.getMetrics);
router.get('/alerts', dashboardController.getAlerts);
router.get('/recent-activity', dashboardController.getRecentActivity);

export { router as dashboardRoutes };