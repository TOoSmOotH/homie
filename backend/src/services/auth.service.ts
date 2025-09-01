import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Repository } from 'typeorm';
import { dbConnection } from '../database/connection';
import { User, UserStatus, UserRole } from '../models/User';
import { config } from '../config';
import { logger } from '../utils/logger';
import { emailService } from './email.service';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserPayload {
  id: string;
  username: string;
  email: string;
  role: UserRole;
}

export class AuthService {
  // Lazily initialized repository; definite assignment to avoid nullable type
  private userRepository!: Repository<User>;

  private getUserRepository(): Repository<User> {
    if (!this.userRepository) {
      this.userRepository = dbConnection.getDataSource().getRepository(User);
    }
    return this.userRepository;
  }

  /**
   * Check if this is the first time setup (no admin exists)
   */
  async isFirstTimeSetup(): Promise<boolean> {
    try {
      const adminCount = await this.getUserRepository().count({
        where: { role: UserRole.ADMIN }
      });
      return adminCount === 0;
    } catch (error) {
      logger.error('Error checking first time setup:', error);
      // If there's an error (e.g., database not initialized), assume first time
      return true;
    }
  }

  /**
   * Create the first admin user during initial setup
   */
  async createInitialAdmin(data: RegisterData): Promise<{ user: User; tokens: AuthTokens }> {
    try {
      // Check if admin already exists
      const isFirstTime = await this.isFirstTimeSetup();
      if (!isFirstTime) {
        throw new Error('Admin user already exists');
      }

      // Hash password
      const passwordHash = await this.hashPassword(data.password);

      // Create admin user
      const user = this.getUserRepository().create({
        ...data,
        passwordHash,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        emailVerified: true // Auto-verify first admin
      });

      await this.getUserRepository().save(user);

      // Generate tokens
      const tokens = await this.generateTokens(user);

      logger.info(`Initial admin user created: ${user.username}`);
      return { user, tokens };
    } catch (error) {
      logger.error('Initial admin creation error:', error);
      throw error;
    }
  }

  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<{ user: User; tokens: AuthTokens }> {
    try {
      // Check if user already exists
      const existingUser = await this.getUserRepository().findOne({
        where: [
          { email: data.email },
          { username: data.username }
        ]
      });

      if (existingUser) {
        throw new Error('User with this email or username already exists');
      }

      // Hash password
      const passwordHash = await this.hashPassword(data.password);

      // Create user
      const user = this.getUserRepository().create({
        ...data,
        passwordHash,
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        emailVerified: !config.features.emailVerification // Auto-verify if feature disabled
      });

      // Only handle email verification if feature is enabled
      if (config.features.emailVerification) {
        // Generate email verification token
        const verificationToken = user.generateEmailVerificationToken();
        await this.getUserRepository().save(user);
        // Send verification email
        await this.sendVerificationEmail(user.email, verificationToken);
      } else {
        await this.getUserRepository().save(user);
      }

      // Generate tokens
      const tokens = await this.generateTokens(user);

      logger.info(`User registered successfully: ${user.username}`);
      return { user, tokens };
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Login user with credentials
   */
  async login(credentials: LoginCredentials, ip?: string): Promise<{ user: User; tokens: AuthTokens }> {
    try {
      // Find user by username
      const user = await this.getUserRepository().findOne({
        where: { username: credentials.username },
        relations: ['settings']
      });

      if (!user) {
        throw new Error('Invalid username or password');
      }

      // Check if account is locked
      if (user.isLocked) {
        throw new Error('Account is temporarily locked due to multiple failed login attempts');
      }

      // Check if account is active
      if (!user.isActive) {
        throw new Error('Account is not active');
      }

      // Verify password
      const isValidPassword = await this.verifyPassword(credentials.password, user.passwordHash);
      if (!isValidPassword) {
        await this.handleFailedLogin(user);
        throw new Error('Invalid username or password');
      }

      // Update last login and reset login attempts
      user.updateLastLogin(ip);
      await this.getUserRepository().save(user);

      // Generate tokens
      const tokens = await this.generateTokens(user);

      logger.info(`User logged in successfully: ${user.username}`);
      return { user, tokens };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, config.jwtSecret) as UserPayload & { type: string };

      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // Find user and validate refresh token
      const user = await this.getUserRepository().findOne({
        where: { id: decoded.id }
      });

      if (!user || user.refreshToken !== refreshToken || !user.isRefreshTokenValid()) {
        throw new Error('Invalid or expired refresh token');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(user);
      return tokens;
    } catch (error) {
      logger.error('Token refresh error:', error);
      throw error;
    }
  }

  /**
   * Logout user by clearing refresh token
   */
  async logout(userId: string): Promise<void> {
    try {
      const user = await this.getUserRepository().findOne({
        where: { id: userId }
      });

      if (user) {
        user.clearRefreshToken();
        await this.getUserRepository().save(user);
        logger.info(`User logged out: ${user.username}`);
      }
    } catch (error) {
      logger.error('Logout error:', error);
      throw error;
    }
  }

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string): Promise<User> {
    const user = await this.getUserRepository().findOne({
      where: { id: userId },
      relations: ['settings']
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  /**
   * Verify JWT token and return user payload
   */
  async verifyToken(token: string): Promise<UserPayload> {
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as UserPayload & { type: string };

      if (decoded.type !== 'access') {
        throw new Error('Invalid token type');
      }

      return {
        id: decoded.id,
        username: decoded.username,
        email: decoded.email,
        role: decoded.role
      };
    } catch (error) {
      logger.error('Token verification error:', error);
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Generate access and refresh tokens for user
   */
  private async generateTokens(user: User): Promise<AuthTokens> {
    const payload: UserPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };

    // Generate access token
    const accessToken = jwt.sign(
      { ...payload, type: 'access' },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn } as jwt.SignOptions
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      { ...payload, type: 'refresh' },
      config.jwtSecret,
      { expiresIn: '7d' } as jwt.SignOptions
    );

    // Store refresh token in database
    user.setRefreshToken(refreshToken);
    await this.getUserRepository().save(user);

    return { accessToken, refreshToken };
  }

  /**
   * Hash password using bcrypt
   */
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Verify password against hash
   */
  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Handle failed login attempt
   */
  private async handleFailedLogin(user: User): Promise<void> {
    user.incrementLoginAttempts();
    await this.getUserRepository().save(user);
  }

  /**
   * Send verification email to user
   */
  async sendVerificationEmail(email: string, token: string): Promise<void> {
    try {
      await emailService.sendVerificationEmail(email, token);
      logger.info(`Verification email sent to ${email}`);
    } catch (error) {
      logger.error('Failed to send verification email:', error);
      // Don't throw - email failure shouldn't break registration
    }
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
    try {
      // Hash the provided token for comparison
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      // Find user with matching token that hasn't expired
      const user = await this.getUserRepository()
        .createQueryBuilder('user')
        .where('user.emailVerificationToken = :token', { token: hashedToken })
        .andWhere('user.emailVerificationExpires > :now', { now: new Date() })
        .getOne();

      if (!user) {
        return { 
          success: false, 
          message: 'Invalid or expired verification token' 
        };
      }

      // Mark email as verified
      user.emailVerified = true;
      user.clearEmailVerificationToken();
      await this.getUserRepository().save(user);

      logger.info(`Email verified for user: ${user.username}`);
      return { 
        success: true, 
        message: 'Email verified successfully' 
      };
    } catch (error) {
      logger.error('Email verification error:', error);
      return { 
        success: false, 
        message: 'Failed to verify email' 
      };
    }
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = await this.getUserRepository().findOne({
        where: { id: userId }
      });

      if (!user) {
        return { 
          success: false, 
          message: 'User not found' 
        };
      }

      if (user.emailVerified) {
        return { 
          success: false, 
          message: 'Email already verified' 
        };
      }

      // Generate new verification token
      const verificationToken = user.generateEmailVerificationToken();
      await this.getUserRepository().save(user);

      // Send verification email
      await this.sendVerificationEmail(user.email, verificationToken);

      return { 
        success: true, 
        message: 'Verification email sent' 
      };
    } catch (error) {
      logger.error('Resend verification error:', error);
      return { 
        success: false, 
        message: 'Failed to resend verification email' 
      };
    }
  }
}
