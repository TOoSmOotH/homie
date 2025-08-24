import { Request, Response, NextFunction } from 'express';
import { AuthService, LoginCredentials, RegisterData } from '../services/auth.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';
import { config } from '../config';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Check if this is first time setup (no admin exists)
   */
  checkFirstTimeSetup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const isFirstTime = await this.authService.isFirstTimeSetup();
      
      res.json({
        success: true,
        data: {
          isFirstTimeSetup: isFirstTime
        }
      });
    } catch (error) {
      logger.error('Check first time setup error:', error);
      next(error);
    }
  };

  /**
   * Get enabled features
   */
  getFeatures = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json({
        success: true,
        data: {
          features: config.features
        }
      });
    } catch (error) {
      logger.error('Get features error:', error);
      next(error);
    }
  };

  /**
   * Create initial admin user (first time setup only)
   */
  createInitialAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const registerData: RegisterData = {
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
        firstName: req.body.firstName || '',
        lastName: req.body.lastName || ''
      };

      const { user, tokens } = await this.authService.createInitialAdmin(registerData);

      logger.info(`Initial admin created successfully: ${user.username}`);

      res.status(201).json({
        success: true,
        message: 'Initial admin created successfully',
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            status: user.status,
            emailVerified: user.emailVerified,
            createdAt: user.createdAt
          },
          tokens
        }
      });
    } catch (error) {
      logger.error('Initial admin creation error:', error);
      next(error);
    }
  };

  /**
   * Register a new user
   */
  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const registerData: RegisterData = {
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
        firstName: req.body.firstName || '',
        lastName: req.body.lastName || ''
      };

      const { user, tokens } = await this.authService.register(registerData);

      logger.info(`User registered successfully: ${user.username}`);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            status: user.status,
            emailVerified: user.emailVerified,
            createdAt: user.createdAt
          },
          tokens
        }
      });
    } catch (error) {
      logger.error('Registration error:', error);
      next(error);
    }
  };

  /**
   * Login user with credentials
   */
  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const loginCredentials: LoginCredentials = {
        username: req.body.username,
        password: req.body.password
      };

      const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
      const { user, tokens } = await this.authService.login(loginCredentials, clientIP);

      logger.info(`User logged in successfully: ${user.username}`);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            status: user.status,
            emailVerified: user.emailVerified,
            lastLoginAt: user.lastLoginAt
          },
          tokens
        }
      });
    } catch (error) {
      logger.error('Login error:', error);
      next(error);
    }
  };

  /**
   * Logout user
   */
  logout = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      await this.authService.logout(req.user.id);

      logger.info(`User logged out: ${req.user.username}`);

      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      logger.error('Logout error:', error);
      next(error);
    }
  };

  /**
   * Refresh access token using refresh token
   */
  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new AppError('Refresh token is required', 400);
      }

      const tokens = await this.authService.refreshToken(refreshToken);

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: { tokens }
      });
    } catch (error) {
      logger.error('Token refresh error:', error);
      next(error);
    }
  };

  /**
   * Get current user profile
   */
  getProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const user = await this.authService.getUserProfile(req.user.id);

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            status: user.status,
            emailVerified: user.emailVerified,
            lastLoginAt: user.lastLoginAt,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          }
        }
      });
    } catch (error) {
      logger.error('Get profile error:', error);
      next(error);
    }
  };

  /**
   * Verify user email with token
   */
  verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token } = req.body;

      if (!token) {
        throw new AppError('Verification token is required', 400);
      }

      const result = await this.authService.verifyEmail(token);

      if (!result.success) {
        throw new AppError(result.message, 400);
      }

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      logger.error('Email verification error:', error);
      next(error);
    }
  };

  /**
   * Resend verification email
   */
  resendVerification = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const result = await this.authService.resendVerificationEmail(req.user.id);

      if (!result.success) {
        throw new AppError(result.message, 400);
      }

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      logger.error('Resend verification error:', error);
      next(error);
    }
  };

  /**
   * Request password reset (placeholder for future implementation)
   */
  requestPasswordReset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // TODO: Implement password reset logic
      res.json({
        success: true,
        message: 'Password reset request endpoint - not implemented yet'
      });
    } catch (error) {
      logger.error('Password reset request error:', error);
      next(error);
    }
  };

  /**
   * Reset password (placeholder for future implementation)
   */
  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // TODO: Implement password reset logic
      res.json({
        success: true,
        message: 'Password reset endpoint - not implemented yet'
      });
    } catch (error) {
      logger.error('Password reset error:', error);
      next(error);
    }
  };
}