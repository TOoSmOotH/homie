import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();
const userController = new UserController();

// Protected routes (authentication required)
router.get('/', authenticateToken, userController.getAllUsers);
router.get('/:userId', authenticateToken, userController.getUserById);
router.post('/', authenticateToken, userController.createUser);
router.put('/:userId', authenticateToken, userController.updateUser);
router.delete('/:userId', authenticateToken, userController.deleteUser);
router.post('/:userId/reset-password', authenticateToken, userController.resetUserPassword);
router.post('/:userId/toggle-status', authenticateToken, userController.toggleUserStatus);

// Public routes for password reset
router.post('/password-reset/request', userController.requestPasswordReset);
router.post('/password-reset/confirm', userController.confirmPasswordReset);

export { router as userRoutes };