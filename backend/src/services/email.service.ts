import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';
import { config } from '../config';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private emailsSentToday: Map<string, number> = new Map();
  private lastResetDate: Date = new Date();
  private readonly MAX_EMAILS_PER_DAY = 10; // Gmail limit for home use
  private readonly MAX_EMAILS_PER_USER_PER_DAY = 3; // Per user limit
  private isConfigured: boolean = false;

  constructor() {
    this.initializeTransporter();
    // Reset counters daily
    setInterval(() => this.resetDailyCounters(), 24 * 60 * 60 * 1000);
  }

  private initializeTransporter() {
    // Check if email configuration exists
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpHost || !smtpUser || !smtpPass) {
      logger.warn('Email service not configured. Password reset emails will not be sent.');
      logger.info('To enable email, configure SMTP settings in .env file');
      this.isConfigured = false;
      return;
    }

    try {
      // Gmail configuration
      if (smtpHost.includes('gmail')) {
        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: smtpUser,
            pass: smtpPass // Use App Password, not regular password
          }
        });
        logger.info('Email service configured with Gmail');
      } else {
        // Generic SMTP configuration
        this.transporter = nodemailer.createTransport({
          host: smtpHost,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: smtpUser,
            pass: smtpPass
          }
        });
        logger.info(`Email service configured with ${smtpHost}`);
      }

      this.isConfigured = true;

      // Verify connection
      if (this.transporter) {
        this.transporter.verify((error) => {
          if (error) {
            logger.error('Email service verification failed:', error);
            logger.info('Please check your SMTP configuration');
            this.isConfigured = false;
          } else {
            logger.info('Email service ready');
          }
        });
      }
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
      this.isConfigured = false;
    }
  }

  private resetDailyCounters() {
    const now = new Date();
    if (now.getDate() !== this.lastResetDate.getDate()) {
      this.emailsSentToday.clear();
      this.lastResetDate = now;
      logger.info('Email daily counters reset');
    }
  }

  private checkRateLimit(email: string): boolean {
    // Get total emails sent today
    const totalSent = Array.from(this.emailsSentToday.values()).reduce((a, b) => a + b, 0);
    
    if (totalSent >= this.MAX_EMAILS_PER_DAY) {
      logger.warn(`Daily email limit reached (${this.MAX_EMAILS_PER_DAY})`);
      return false;
    }

    // Check per-user limit
    const userSent = this.emailsSentToday.get(email) || 0;
    if (userSent >= this.MAX_EMAILS_PER_USER_PER_DAY) {
      logger.warn(`User email limit reached for ${email} (${this.MAX_EMAILS_PER_USER_PER_DAY})`);
      return false;
    }

    return true;
  }

  private incrementCounter(email: string) {
    const current = this.emailsSentToday.get(email) || 0;
    this.emailsSentToday.set(email, current + 1);
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
    // If email is not configured, log the token instead
    if (!this.isConfigured || !this.transporter) {
      logger.warn('Email service not configured. Password reset token logged instead.');
      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.info('PASSWORD RESET TOKEN (Email service not configured)');
      logger.info(`User: ${email}`);
      logger.info(`Reset Link: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/password-reset?token=${resetToken}`);
      logger.info('Token expires in 1 hour');
      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // Still return true so the flow continues
      return true;
    }

    // Check rate limits
    if (!this.checkRateLimit(email)) {
      logger.error(`Rate limit exceeded for ${email}. Email not sent.`);
      // Log the token as fallback
      logger.info(`FALLBACK - Reset token for ${email}: ${resetToken}`);
      return false;
    }

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/password-reset?token=${resetToken}`;

    const mailOptions: EmailOptions = {
      to: email,
      subject: 'Password Reset - Homie',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>You requested a password reset for your Homie account.</p>
          <p>Click the link below to reset your password:</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
            Reset Password
          </a>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <p><strong>This link will expire in 1 hour.</strong></p>
          <p>If you didn't request this, please ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px;">
            This is an automated email from your Homie home lab management system.
          </p>
        </div>
      `,
      text: `
        Password Reset Request
        
        You requested a password reset for your Homie account.
        
        Reset your password using this link:
        ${resetUrl}
        
        This link will expire in 1 hour.
        
        If you didn't request this, please ignore this email.
      `
    };

    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.SMTP_USER || 'noreply@homie.local',
        ...mailOptions
      });
      
      this.incrementCounter(email);
      logger.info(`Password reset email sent to ${email}`);
      return true;
    } catch (error) {
      logger.error('Failed to send password reset email:', error);
      // Log token as fallback
      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.info('FALLBACK - Email failed, token logged for manual sharing');
      logger.info(`User: ${email}`);
      logger.info(`Reset Link: ${resetUrl}`);
      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return false;
    }
  }

  async sendVerificationEmail(email: string, verificationToken: string): Promise<boolean> {
    // If email is not configured, log the token instead
    if (!this.isConfigured || !this.transporter) {
      logger.warn('Email service not configured. Verification token logged instead.');
      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.info('EMAIL VERIFICATION TOKEN (Email service not configured)');
      logger.info(`User: ${email}`);
      logger.info(`Verification Link: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`);
      logger.info('Token expires in 24 hours');
      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // Still return true so the flow continues
      return true;
    }

    // Check rate limits
    if (!this.checkRateLimit(email)) {
      logger.error(`Rate limit exceeded for ${email}. Verification email not sent.`);
      // Log the token as fallback
      logger.info(`FALLBACK - Verification token for ${email}: ${verificationToken}`);
      return false;
    }

    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;

    const mailOptions: EmailOptions = {
      to: email,
      subject: 'Verify Your Email - Homie',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Verify Your Email Address</h2>
          <p>Welcome to Homie! Please verify your email address to complete your registration.</p>
          <p>Click the link below to verify your email:</p>
          <a href="${verifyUrl}" style="display: inline-block; padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
            Verify Email
          </a>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${verifyUrl}</p>
          <p><strong>This link will expire in 24 hours.</strong></p>
          <p>If you didn't create an account, please ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px;">
            This is an automated email from your Homie home lab management system.
          </p>
        </div>
      `,
      text: `
        Verify Your Email Address
        
        Welcome to Homie! Please verify your email address to complete your registration.
        
        Verify your email using this link:
        ${verifyUrl}
        
        This link will expire in 24 hours.
        
        If you didn't create an account, please ignore this email.
      `
    };

    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.SMTP_USER || 'noreply@homie.local',
        ...mailOptions
      });
      
      this.incrementCounter(email);
      logger.info(`Verification email sent to ${email}`);
      return true;
    } catch (error) {
      logger.error('Failed to send verification email:', error);
      // Log token as fallback
      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.info('FALLBACK - Email failed, token logged for manual sharing');
      logger.info(`User: ${email}`);
      logger.info(`Verification Link: ${verifyUrl}`);
      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return false;
    }
  }

  async sendWelcomeEmail(email: string, username: string, tempPassword?: string): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      if (tempPassword) {
        logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        logger.info('NEW USER CREDENTIALS (Email service not configured)');
        logger.info(`Username: ${username}`);
        logger.info(`Email: ${email}`);
        logger.info(`Temporary Password: ${tempPassword}`);
        logger.info(`Login URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`);
        logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      }
      return true;
    }

    if (!this.checkRateLimit(email)) {
      logger.error(`Rate limit exceeded for ${email}. Welcome email not sent.`);
      if (tempPassword) {
        logger.info(`FALLBACK - Credentials for ${username}: ${tempPassword}`);
      }
      return false;
    }

    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`;

    const mailOptions: EmailOptions = {
      to: email,
      subject: 'Welcome to Homie',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to Homie!</h2>
          <p>Your account has been created successfully.</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Username:</strong> ${username}</p>
            ${tempPassword ? `<p><strong>Temporary Password:</strong> ${tempPassword}</p>` : ''}
          </div>
          ${tempPassword ? '<p style="color: #d97706;"><strong>Please change your password after logging in.</strong></p>' : ''}
          <a href="${loginUrl}" style="display: inline-block; padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
            Login to Homie
          </a>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px;">
            This is an automated email from your Homie home lab management system.
          </p>
        </div>
      `,
      text: `
        Welcome to Homie!
        
        Your account has been created successfully.
        
        Username: ${username}
        ${tempPassword ? `Temporary Password: ${tempPassword}` : ''}
        
        ${tempPassword ? 'Please change your password after logging in.' : ''}
        
        Login at: ${loginUrl}
      `
    };

    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.SMTP_USER || 'noreply@homie.local',
        ...mailOptions
      });
      
      this.incrementCounter(email);
      logger.info(`Welcome email sent to ${email}`);
      return true;
    } catch (error) {
      logger.error('Failed to send welcome email:', error);
      if (tempPassword) {
        logger.info(`FALLBACK - Credentials for ${username}: ${tempPassword}`);
      }
      return false;
    }
  }

  // Test email configuration
  async testEmailConfiguration(): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      logger.info('Email configuration test successful');
      return true;
    } catch (error) {
      logger.error('Email configuration test failed:', error);
      return false;
    }
  }

  // Get email service status
  getStatus() {
    const totalSent = Array.from(this.emailsSentToday.values()).reduce((a, b) => a + b, 0);
    
    return {
      configured: this.isConfigured,
      provider: process.env.SMTP_HOST?.includes('gmail') ? 'Gmail' : process.env.SMTP_HOST,
      dailyLimit: this.MAX_EMAILS_PER_DAY,
      emailsSentToday: totalSent,
      remainingToday: Math.max(0, this.MAX_EMAILS_PER_DAY - totalSent)
    };
  }
}

// Export singleton instance
export const emailService = new EmailService();