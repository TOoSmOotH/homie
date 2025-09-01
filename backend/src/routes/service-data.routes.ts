import { Router } from 'express';
import { GenericServiceController } from '../controllers/generic-service.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();
const controller = new GenericServiceController();

// Require authentication only for service endpoints within this router
router.use('/services', authenticateToken);

// Generic data fetching for any service
router.post('/services/:id/data', controller.fetchData);

// Test service connection
router.post('/services/:id/test', controller.testConnection);

// Execute quick action
router.post('/services/:id/action', controller.executeAction);

export default router;
