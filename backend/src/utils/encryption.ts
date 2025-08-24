import crypto from 'crypto';
import { config } from '../config';
import { logger } from './logger';

export interface EncryptionConfig {
  algorithm: string;
  keyLength: number;
  ivLength: number;
}

export class EncryptionService {
  private static instance: EncryptionService;
  private encryptionKey: string;
  private config: EncryptionConfig;

  private constructor() {
    this.encryptionKey = this.getOrCreateEncryptionKey();
    this.config = {
      algorithm: 'aes-256-gcm',
      keyLength: 32,
      ivLength: 16,
    };
  }

  public static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  /**
   * Get or create encryption key from environment or generate a new one
   */
  private getOrCreateEncryptionKey(): string {
    let key = process.env.ENCRYPTION_KEY;

    if (!key) {
      // Generate a new key if not provided
      key = crypto.randomBytes(32).toString('hex');
      logger.warn('ENCRYPTION_KEY not found in environment, generated new key. Please set ENCRYPTION_KEY in production.');

      // In development, you might want to save this key
      if (config.nodeEnv === 'development') {
        logger.info(`Generated encryption key: ${key}`);
      }
    }

    return key;
  }

  /**
   * Encrypt a string value using AES-256-CBC
   */
  public encrypt(plaintext: string): string {
    try {
      const iv = crypto.randomBytes(this.config.ivLength);
      const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey.substring(0, this.config.keyLength), iv);

      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Combine iv and encrypted data
      const result = {
        iv: iv.toString('hex'),
        encrypted: encrypted,
      };

      return JSON.stringify(result);
    } catch (error) {
      logger.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt a previously encrypted string value
   */
  public decrypt(encryptedData: string): string {
    try {
      const data = JSON.parse(encryptedData);
      const iv = Buffer.from(data.iv, 'hex');
      const encrypted = data.encrypted;

      const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey.substring(0, this.config.keyLength), iv);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      logger.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Hash a password using bcrypt (for password hashing, not encryption)
   */
  public async hashPassword(password: string): Promise<string> {
    const bcrypt = await import('bcryptjs');
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Verify a password against a hash
   */
  public async verifyPassword(password: string, hash: string): Promise<boolean> {
    const bcrypt = await import('bcryptjs');
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate a secure random token
   */
  public generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Hash sensitive data that doesn't need to be decrypted (one-way)
   */
  public hashData(data: string, salt?: string): string {
    const hashSalt = salt || crypto.randomBytes(16).toString('hex');
    return crypto.createHash('sha256').update(data + hashSalt).digest('hex') + ':' + hashSalt;
  }

  /**
   * Verify hashed data
   */
  public verifyHashedData(data: string, hashedData: string): boolean {
    const [hash, salt] = hashedData.split(':');
    const newHash = crypto.createHash('sha256').update(data + salt).digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(hash, 'hex'),
      Buffer.from(newHash, 'hex')
    );
  }
}

// Export singleton instance
export const encryptionService = EncryptionService.getInstance();

// Utility functions for easier access
export const encrypt = (data: string): string => encryptionService.encrypt(data);
export const decrypt = (data: string): string => encryptionService.decrypt(data);
export const hashPassword = (password: string): Promise<string> => encryptionService.hashPassword(password);
export const verifyPassword = (password: string, hash: string): Promise<boolean> => encryptionService.verifyPassword(password, hash);