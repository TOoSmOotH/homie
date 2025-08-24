import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/auth.middleware';
import { UserRole, UserStatus } from '../models/User';
import { logger } from '../utils/logger';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * Get all users (admin only)
   */
  getAllUsers = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || req.user.role !== UserRole.ADMIN) {
        throw new AppError('Admin access required', 403);
      }

      const users = await this.userService.getAllUsers();

      res.json({
        success: true,
        data: { users }
      });
    } catch (error) {
      logger.error('Get all users error:', error);
      next(error);
    }
  };

  /**
   * Get user by ID
   */
  getUserById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const { userId } = req.params;

      // Users can only view their own profile unless they're admin
      if (req.user.role !== UserRole.ADMIN && req.user.id !== userId) {
        throw new AppError('Access denied', 403);
      }

      const user = await this.userService.getUserById(userId);

      res.json({
        success: true,
        data: { user }
      });
    } catch (error) {
      logger.error('Get user by ID error:', error);
      next(error);
    }
  };

  /**
   * Create new user (admin only)
   */
  createUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || req.user.role !== UserRole.ADMIN) {
        throw new AppError('Admin access required', 403);
      }

      const { username, email, password, firstName, lastName, role } = req.body;

      if (!username || !email || !role) {
        throw new AppError('Username, email, and role are required', 400);
      }

      const user = await this.userService.createUser({
        username,
        email,
        password,
        firstName: firstName || '',
        lastName: lastName || '',
        role
      });

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: { user }
      });
    } catch (error) {
      logger.error('Create user error:', error);
      next(error);
    }
  };

  /**
   * Update user
   */
  updateUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const { userId } = req.params;
      const { email, firstName, lastName, role, status } = req.body;

      // Users can only update their own profile (limited fields) unless they're admin
      if (req.user.role !== UserRole.ADMIN) {
        if (req.user.id !== userId) {
          throw new AppError('Access denied', 403);
        }
        // Non-admins can't change role or status
        if (role !== undefined || status !== undefined) {
          throw new AppError('Cannot modify role or status', 403);
        }
      }

      const user = await this.userService.updateUser(userId, {
        email,
        firstName,
        lastName,
        role,
        status
      });

      res.json({
        success: true,
        message: 'User updated successfully',
        data: { user }
      });
    } catch (error) {
      logger.error('Update user error:', error);
      next(error);
    }
  };

  /**
   * Delete user (admin only)
   */
  deleteUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || req.user.role !== UserRole.ADMIN) {
        throw new AppError('Admin access required', 403);
      }

      const { userId } = req.params;

      // Prevent self-deletion
      if (req.user.id === userId) {
        throw new AppError('Cannot delete your own account', 400);
      }

      await this.userService.deleteUser(userId);

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      logger.error('Delete user error:', error);
      next(error);
    }
  };

  /**
   * Reset user password (admin only)
   */
  resetUserPassword = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || req.user.role !== UserRole.ADMIN) {
        throw new AppError('Admin access required', 403);
      }

      const { userId } = req.params;

      const newPassword = await this.userService.resetUserPassword(userId);

      res.json({
        success: true,
        message: 'Password reset successfully',
        data: { 
          tempPassword: newPassword,
          note: 'Please share this temporary password securely with the user'
        }
      });
    } catch (error) {
      logger.error('Reset user password error:', error);
      next(error);
    }
  };

  /**
   * Toggle user status (admin only)
   */
  toggleUserStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || req.user.role !== UserRole.ADMIN) {
        throw new AppError('Admin access required', 403);
      }

      const { userId } = req.params;

      // Prevent self-deactivation
      if (req.user.id === userId) {
        throw new AppError('Cannot change your own status', 400);
      }

      const user = await this.userService.toggleUserStatus(userId);

      res.json({
        success: true,
        message: `User ${user.status === UserStatus.ACTIVE ? 'activated' : 'deactivated'} successfully`,
        data: { user }
      });
    } catch (error) {
      logger.error('Toggle user status error:', error);
      next(error);
    }
  };

  /**
   * Request password reset (public)
   */
  requestPasswordReset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body;

      if (!email) {
        throw new AppError('Email is required', 400);
      }

      await this.userService.initiatePasswordReset(email);

      // Always return success to prevent email enumeration
      res.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent'
      });
    } catch (error) {
      logger.error('Request password reset error:', error);
      next(error);
    }
  };

  /**
   * Confirm password reset (public)
   */
  confirmPasswordReset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        throw new AppError('Token and new password are required', 400);
      }

      if (newPassword.length < 8) {
        throw new AppError('Password must be at least 8 characters', 400);
      }

      await this.userService.confirmPasswordReset(token, newPassword);

      res.json({
        success: true,
        message: 'Password reset successfully'
      });
    } catch (error) {
      logger.error('Confirm password reset error:', error);
      next(error);
    }
  };
}