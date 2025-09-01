import { Repository } from 'typeorm';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { dbConnection } from '../database/connection';
import { User, UserStatus, UserRole } from '../models/User';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/auth.middleware';
import { emailService } from './email.service';
import { config } from '../config';

export interface CreateUserData {
  username: string;
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface UpdateUserData {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  status?: UserStatus;
}

export interface ResetPasswordData {
  email: string;
}

export interface ConfirmResetData {
  token: string;
  newPassword: string;
}

export class UserService {
  // Lazily initialized repository; definite assignment to avoid nullable type
  private userRepository!: Repository<User>;

  private getUserRepository(): Repository<User> {
    if (!this.userRepository) {
      this.userRepository = dbConnection.getDataSource().getRepository(User);
    }
    return this.userRepository;
  }

  /**
   * Get all users (admin only)
   */
  async getAllUsers(): Promise<User[]> {
    try {
      const users = await this.getUserRepository().find({
        select: [
          'id', 'username', 'email', 'firstName', 'lastName', 
          'role', 'status', 'emailVerified', 'lastLoginAt', 
          'createdAt', 'updatedAt'
        ],
        order: { createdAt: 'DESC' }
      });
      return users;
    } catch (error) {
      logger.error('Error fetching users:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User> {
    try {
      const user = await this.getUserRepository().findOne({
        where: { id: userId },
        select: [
          'id', 'username', 'email', 'firstName', 'lastName', 
          'role', 'status', 'emailVerified', 'lastLoginAt', 
          'createdAt', 'updatedAt'
        ]
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      return user;
    } catch (error) {
      logger.error('Error fetching user:', error);
      throw error;
    }
  }

  /**
   * Create a new user (admin only)
   */
  async createUser(data: CreateUserData): Promise<User> {
    try {
      // Check if user already exists
      const existingUser = await this.getUserRepository().findOne({
        where: [
          { email: data.email },
          { username: data.username }
        ]
      });

      if (existingUser) {
        throw new AppError('User with this email or username already exists', 400);
      }

      // Generate random password if not provided
      const password = data.password || this.generateRandomPassword();
      const passwordHash = await this.hashPassword(password);

      // Create user
      const user = this.getUserRepository().create({
        username: data.username,
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        status: UserStatus.ACTIVE,
        emailVerified: !config.features.emailVerification // Auto-verify if feature disabled
      });

      await this.getUserRepository().save(user);

      // Remove password hash from response
      delete (user as any).passwordHash;

      logger.info(`User created successfully: ${user.username}`);
      
      // Return the password only if it was generated
      if (!data.password) {
        (user as any).tempPassword = password;
      }

      return user;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Update user details
   */
  async updateUser(userId: string, data: UpdateUserData): Promise<User> {
    try {
      const user = await this.getUserRepository().findOne({
        where: { id: userId }
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Update fields
      if (data.email !== undefined) user.email = data.email;
      if (data.firstName !== undefined) user.firstName = data.firstName;
      if (data.lastName !== undefined) user.lastName = data.lastName;
      if (data.role !== undefined) user.role = data.role;
      if (data.status !== undefined) user.status = data.status;

      await this.getUserRepository().save(user);

      // Remove sensitive data
      delete (user as any).passwordHash;
      delete (user as any).refreshToken;

      logger.info(`User updated successfully: ${user.username}`);
      return user;
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Delete user (soft delete by setting status to DELETED)
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      const user = await this.getUserRepository().findOne({
        where: { id: userId }
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Don't allow deleting the last admin
      if (user.role === UserRole.ADMIN) {
        const adminCount = await this.getUserRepository().count({
          where: { role: UserRole.ADMIN }
        });
        if (adminCount <= 1) {
          throw new AppError('Cannot delete the last admin user', 400);
        }
      }

      user.status = UserStatus.DELETED;
      await this.getUserRepository().save(user);

      logger.info(`User deleted successfully: ${user.username}`);
    } catch (error) {
      logger.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Reset user password (admin action)
   */
  async resetUserPassword(userId: string): Promise<string> {
    try {
      const user = await this.getUserRepository().findOne({
        where: { id: userId }
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Generate new random password
      const newPassword = this.generateRandomPassword();
      const passwordHash = await this.hashPassword(newPassword);

      user.passwordHash = passwordHash;
      await this.getUserRepository().save(user);

      logger.info(`Password reset for user: ${user.username}`);
      return newPassword;
    } catch (error) {
      logger.error('Error resetting password:', error);
      throw error;
    }
  }

  /**
   * Initiate password reset (sends reset token)
   */
  async initiatePasswordReset(email: string): Promise<void> {
    try {
      const user = await this.getUserRepository().findOne({
        where: { email }
      });

      if (!user) {
        // Don't reveal if user exists or not
        logger.info(`Password reset attempted for non-existent email: ${email}`);
        return;
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenHash = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

      // Store hashed token and expiry
      user.passwordResetToken = resetTokenHash;
      user.passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour
      await this.getUserRepository().save(user);

      // Send password reset email
      await emailService.sendPasswordResetEmail(user.email, resetToken);
      
      logger.info(`Password reset initiated for ${user.email}`);
    } catch (error) {
      logger.error('Error initiating password reset:', error);
      throw error;
    }
  }

  /**
   * Confirm password reset with token
   */
  async confirmPasswordReset(token: string, newPassword: string): Promise<void> {
    try {
      // Hash the provided token
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      // Find user with matching token that hasn't expired
      const user = await this.getUserRepository()
        .createQueryBuilder('user')
        .where('user.passwordResetToken = :token', { token: hashedToken })
        .andWhere('user.passwordResetExpires > :now', { now: new Date() })
        .getOne();

      if (!user) {
        throw new AppError('Invalid or expired reset token', 400);
      }

      // Update password
      const passwordHash = await this.hashPassword(newPassword);
      user.passwordHash = passwordHash;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await this.getUserRepository().save(user);

      logger.info(`Password reset completed for user: ${user.username}`);
    } catch (error) {
      logger.error('Error confirming password reset:', error);
      throw error;
    }
  }

  /**
   * Toggle user status (activate/deactivate)
   */
  async toggleUserStatus(userId: string): Promise<User> {
    try {
      const user = await this.getUserRepository().findOne({
        where: { id: userId }
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      user.status = user.status === UserStatus.ACTIVE 
        ? UserStatus.INACTIVE 
        : UserStatus.ACTIVE;

      await this.getUserRepository().save(user);

      // Remove sensitive data
      delete (user as any).passwordHash;
      delete (user as any).refreshToken;

      logger.info(`User status toggled: ${user.username} - ${user.status}`);
      return user;
    } catch (error) {
      logger.error('Error toggling user status:', error);
      throw error;
    }
  }

  /**
   * Generate random password
   */
  private generateRandomPassword(): string {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }

  /**
   * Hash password using bcrypt
   */
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }
}
