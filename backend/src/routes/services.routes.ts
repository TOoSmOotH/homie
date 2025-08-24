import { Router } from 'express';
import { ServicesController } from '../controllers/services.controller';
import { ServiceCrudController } from '../controllers/service-crud.controller';
import WebSocketService from '../services/websocket.service';

const router = Router();
const servicesController = new ServicesController();
const serviceCrudController = new ServiceCrudController();

// Initialize WebSocket service when the app starts
let wsService: WebSocketService | undefined;

export function initializeServicesRoutes(webSocketService: WebSocketService) {
  wsService = webSocketService;
  servicesController.setWebSocketService(wsService);
}

// CRUD routes for generic service management
router.get('/', serviceCrudController.getAllServices);
router.post('/', serviceCrudController.createService);
router.get('/:id', serviceCrudController.getServiceById);
router.put('/:id', serviceCrudController.updateService);
router.delete('/:id', serviceCrudController.deleteService);
router.post('/:id/check', serviceCrudController.checkStatus);
router.post('/check-all', serviceCrudController.checkAllServices);

// Legacy service type routes (for specific integrations)
router.get('/types/available', servicesController.getServices);
router.get('/type/:serviceType', servicesController.getServiceByType);
router.post('/type/:serviceType/status', servicesController.getServiceStatus);
router.post('/type/:serviceType/start', servicesController.startService);
router.post('/type/:serviceType/stop', servicesController.stopService);
router.post('/type/:serviceType/restart', servicesController.restartService);

// Radarr-specific routes
router.get('/radarr/movies', servicesController.getRadarrMovies);
router.get('/radarr/movies/:id', servicesController.getRadarrMovie);
router.post('/radarr/movies', servicesController.addRadarrMovie);
router.put('/radarr/movies/:id', servicesController.updateRadarrMovie);
router.delete('/radarr/movies/:id', servicesController.deleteRadarrMovie);
router.get('/radarr/quality-profiles', servicesController.getRadarrQualityProfiles);
router.get('/radarr/queue', servicesController.getRadarrQueue);
router.post('/radarr/movies/:id/search', servicesController.searchRadarrMovie);

// Sabnzbd-specific routes
router.get('/sabnzbd/queue', servicesController.getSabnzbdQueue);
router.post('/sabnzbd/nzb', servicesController.addSabnzbdNzb);
router.post('/sabnzbd/queue/pause', servicesController.pauseSabnzbdQueue);
router.post('/sabnzbd/queue/resume', servicesController.resumeSabnzbdQueue);
router.post('/sabnzbd/jobs/:id/pause', servicesController.pauseSabnzbdJob);
router.post('/sabnzbd/jobs/:id/resume', servicesController.resumeSabnzbdJob);
router.delete('/sabnzbd/jobs/:id', servicesController.deleteSabnzbdJob);
router.put('/sabnzbd/jobs/:id/priority', servicesController.changeSabnzbdJobPriority);
router.get('/sabnzbd/history', servicesController.getSabnzbdHistory);
router.get('/sabnzbd/categories', servicesController.getSabnzbdCategories);

export { router as servicesRoutes };