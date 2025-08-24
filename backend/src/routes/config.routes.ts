import { Router } from 'express';
import { ConfigController } from '../controllers/config.controller';

const router = Router();
const configController = new ConfigController();

// Routes
router.get('/', configController.getConfig);
router.put('/', configController.updateConfig);
router.get('/services', configController.getServiceConfigs);
router.post('/services', configController.addServiceConfig);
router.put('/services/:id', configController.updateServiceConfig);
router.delete('/services/:id', configController.deleteServiceConfig);

export { router as configRoutes };