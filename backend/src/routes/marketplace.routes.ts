import { Router } from 'express';
import { MarketplaceController } from '../controllers/marketplace.controller';

const router = Router();
const marketplaceController = new MarketplaceController();

// Marketplace routes
router.get('/services', marketplaceController.getServices);
router.get('/services/featured', marketplaceController.getFeaturedServices);
router.get('/services/search', marketplaceController.searchServices);
router.get('/services/:serviceId', marketplaceController.getServiceDefinition);
router.get('/categories', marketplaceController.getCategories);
router.get('/categories/:category', marketplaceController.getServicesByCategory);
router.get('/statistics', marketplaceController.getStatistics);
router.post('/sync', marketplaceController.syncMarketplace);
router.post('/install/:serviceId', marketplaceController.installService);

export { router as marketplaceRoutes };