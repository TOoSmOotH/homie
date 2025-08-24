import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import crypto from 'crypto';
import { UserSettings } from './UserSettings';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest'
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
  DELETED = 'deleted'
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  username!: string;

  @Column({ type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 100 })
  firstName!: string;

  @Column({ type: 'varchar', length: 100 })
  lastName!: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: UserRole.USER
  })
  role!: UserRole;

  @Column({
    type: 'varchar',
    length: 20,
    default: UserStatus.ACTIVE
  })
  status!: UserStatus;

  @Column({ type: 'boolean', default: false })
  emailVerified!: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  emailVerificationToken?: string;

  @Column({ type: 'datetime', nullable: true })
  emailVerificationExpires?: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  passwordResetToken?: string;

  @Column({ type: 'datetime', nullable: true })
  passwordResetExpires?: Date;

  @Column({ type: 'datetime', nullable: true })
  lastLoginAt?: Date;

  @Column({ type: 'varchar', length: 45, nullable: true })
  lastLoginIp?: string;

  @Column({ type: 'int', default: 0 })
  loginAttempts!: number;

  @Column({ type: 'datetime', nullable: true })
  lockoutUntil?: Date;

  @Column({ type: 'boolean', default: true })
  twoFactorEnabled!: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  twoFactorSecret?: string;

  @Column({ type: 'text', nullable: true })
  refreshToken?: string;

  @Column({ type: 'datetime', nullable: true })
  refreshTokenExpires?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToOne(() => UserSettings, { cascade: true, eager: true })
  @JoinColumn()
  settings!: UserSettings;

  // Virtual fields (not stored in database)
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  get isLocked(): boolean {
    return !!(this.lockoutUntil && this.lockoutUntil > new Date());
  }

  get isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  get isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  // Instance methods
  public incrementLoginAttempts(): void {
    this.loginAttempts += 1;
    if (this.loginAttempts >= 5) {
      // Lock account for 30 minutes after 5 failed attempts
      this.lockoutUntil = new Date(Date.now() + 30 * 60 * 1000);
    }
  }

  public resetLoginAttempts(): void {
    this.loginAttempts = 0;
    this.lockoutUntil = undefined;
  }

  public updateLastLogin(ip?: string): void {
    this.lastLoginAt = new Date();
    if (ip) {
      this.lastLoginIp = ip;
    }
    this.resetLoginAttempts();
  }

  public generateEmailVerificationToken(): string {
    const token = crypto.randomBytes(32).toString('hex');
    // Store hashed token in database
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    this.emailVerificationToken = hashedToken;
    this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    return token; // Return unhashed token for email
  }

  public generatePasswordResetToken(): string {
    const token = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = token;
    this.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    return token;
  }

  public clearEmailVerificationToken(): void {
    this.emailVerificationToken = undefined;
    this.emailVerificationExpires = undefined;
  }

  public clearPasswordResetToken(): void {
    this.passwordResetToken = undefined;
    this.passwordResetExpires = undefined;
  }

  public setRefreshToken(token: string, expiresIn: number = 7 * 24 * 60 * 60 * 1000): void {
    this.refreshToken = token;
    this.refreshTokenExpires = new Date(Date.now() + expiresIn);
  }

  public clearRefreshToken(): void {
    this.refreshToken = undefined;
    this.refreshTokenExpires = undefined;
  }

  public isRefreshTokenValid(): boolean {
    return !!(this.refreshTokenExpires && this.refreshTokenExpires > new Date());
  }
}