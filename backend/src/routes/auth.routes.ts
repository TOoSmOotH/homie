import { Router, Request, Response, NextFunction } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { AppError } from '../middleware/auth.middleware';

const router = Router();
const authController = new AuthController();

// Validation middleware functions
const validateLogin = (req: Request, res: Response, next: NextFunction) => {
  const { username, password } = req.body;

  if (!username || username.length < 3) {
    throw new AppError('Username must be at least 3 characters', 400);
  }

  if (!password || password.length < 6) {
    throw new AppError('Password must be at least 6 characters', 400);
  }

  next();
};

const validateRegister = (req: Request, res: Response, next: NextFunction) => {
  const { username, password, email } = req.body;

  if (!username || username.length < 3) {
    throw new AppError('Username must be at least 3 characters', 400);
  }

  if (!password || password.length < 6) {
    throw new AppError('Password must be at least 6 characters', 400);
  }

  if (!email || !email.includes('@')) {
    throw new AppError('Please provide a valid email', 400);
  }

  if (req.body.firstName && req.body.firstName.length > 100) {
    throw new AppError('First name must be less than 100 characters', 400);
  }

  if (req.body.lastName && req.body.lastName.length > 100) {
    throw new AppError('Last name must be less than 100 characters', 400);
  }

  next();
};

const validateRefreshToken = (req: Request, res: Response, next: NextFunction) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError('Refresh token is required', 400);
  }

  next();
};

const validateChangePassword = (req: Request, res: Response, next: NextFunction) => {
  const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };

  if (!currentPassword || currentPassword.length < 6) {
    throw new AppError('Current password must be at least 6 characters', 400);
  }

  if (!newPassword || newPassword.length < 8) {
    throw new AppError('New password must be at least 8 characters', 400);
  }

  next();
};

// Public routes (no authentication required)
router.get('/check-setup', authController.checkFirstTimeSetup);
router.get('/features', authController.getFeatures);
router.post('/setup-admin', validateRegister, authController.createInitialAdmin);
router.post('/login', validateLogin, authController.login);
router.post('/register', validateRegister, authController.register);
router.post('/refresh-token', validateRefreshToken, authController.refreshToken);

// Protected routes (authentication required)
router.post('/logout', authenticateToken, authController.logout);
router.get('/me', authenticateToken, authController.getProfile);
router.post('/change-password', authenticateToken, validateChangePassword, authController.changePassword);

// Email verification routes
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-verification', authenticateToken, authController.resendVerification);

// Password reset routes (already implemented)
router.post('/request-password-reset', authController.requestPasswordReset);
router.post('/reset-password', authController.resetPassword);

export { router as authRoutes };
