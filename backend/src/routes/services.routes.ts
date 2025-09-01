import { Router } from 'express';
import { ServiceCrudController } from '../controllers/service-crud.controller';
import WebSocketService from '../services/websocket.service';

const router = Router();
const serviceCrudController = new ServiceCrudController();

// Initialize WebSocket service when the app starts
let wsService: WebSocketService | undefined;

export function initializeServicesRoutes(webSocketService: WebSocketService) {
  wsService = webSocketService;
}

// CRUD routes for generic service management (marketplace-driven)
router.get('/', serviceCrudController.getAllServices);
router.post('/', serviceCrudController.createService);
router.get('/:id', serviceCrudController.getServiceById);
router.put('/:id', serviceCrudController.updateService);
router.delete('/:id', serviceCrudController.deleteService);
router.post('/:id/check', serviceCrudController.checkStatus);
router.post('/check-all', serviceCrudController.checkAllServices);

export { router as servicesRoutes };
