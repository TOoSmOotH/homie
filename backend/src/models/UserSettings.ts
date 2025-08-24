import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne } from 'typeorm';
import { User } from './User';

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
  AUTO = 'auto'
}

export enum Language {
  EN = 'en',
  ES = 'es',
  FR = 'fr',
  DE = 'de',
  IT = 'it',
  PT = 'pt',
  RU = 'ru',
  ZH = 'zh',
  JA = 'ja',
  KO = 'ko'
}

export enum DateFormat {
  MM_DD_YYYY = 'MM/DD/YYYY',
  DD_MM_YYYY = 'DD/MM/YYYY',
  YYYY_MM_DD = 'YYYY-MM-DD',
  DD_MMM_YYYY = 'DD MMM YYYY',
  MMM_DD_YYYY = 'MMM DD, YYYY'
}

export enum TimeFormat {
  HOUR_12 = '12h',
  HOUR_24 = '24h'
}

export enum NotificationLevel {
  ALL = 'all',
  IMPORTANT = 'important',
  NONE = 'none'
}

@Entity('user_settings')
export class UserSettings {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Theme and appearance settings
  @Column({
    type: 'varchar',
    length: 20,
    default: Theme.AUTO
  })
  theme!: Theme;

  @Column({
    type: 'varchar',
    length: 5,
    default: Language.EN
  })
  language!: Language;

  @Column({ type: 'varchar', length: 10, default: 'UTC' })
  timezone!: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: DateFormat.MM_DD_YYYY
  })
  dateFormat!: DateFormat;

  @Column({
    type: 'varchar',
    length: 10,
    default: TimeFormat.HOUR_12
  })
  timeFormat!: TimeFormat;

  // Dashboard and layout settings
  @Column({ type: 'json', nullable: true })
  dashboardLayout?: any;

  @Column({ type: 'boolean', default: true })
  showWelcomeMessage!: boolean;

  @Column({ type: 'boolean', default: true })
  showQuickActions!: boolean;

  @Column({ type: 'boolean', default: false })
  compactView!: boolean;

  @Column({ type: 'int', default: 10 })
  itemsPerPage!: number;

  // Notification settings
  @Column({
    type: 'varchar',
    length: 15,
    default: NotificationLevel.ALL
  })
  emailNotifications!: NotificationLevel;

  @Column({
    type: 'varchar',
    length: 15,
    default: NotificationLevel.IMPORTANT
  })
  pushNotifications!: NotificationLevel;

  @Column({ type: 'boolean', default: true })
  notifyOnServiceDown!: boolean;

  @Column({ type: 'boolean', default: true })
  notifyOnServiceUp!: boolean;

  @Column({ type: 'boolean', default: false })
  notifyOnUpdates!: boolean;

  @Column({ type: 'boolean', default: true })
  notifyOnSecurityAlerts!: boolean;

  // Service monitoring settings
  @Column({ type: 'json', nullable: true })
  serviceRefreshIntervals?: { [serviceName: string]: number }; // in seconds

  @Column({ type: 'boolean', default: true })
  autoRefreshEnabled!: boolean;

  @Column({ type: 'int', default: 30 })
  defaultRefreshInterval!: number; // in seconds

  @Column({ type: 'json', nullable: true })
  favoriteServices?: string[];

  @Column({ type: 'json', nullable: true })
  hiddenServices?: string[];

  // Privacy and security settings
  @Column({ type: 'boolean', default: false })
  allowDataCollection!: boolean;

  @Column({ type: 'boolean', default: true })
  showOnlineStatus!: boolean;

  @Column({ type: 'boolean', default: false })
  profileVisibleToPublic!: boolean;

  // Performance settings
  @Column({ type: 'boolean', default: true })
  enableAnimations!: boolean;

  @Column({ type: 'boolean', default: true })
  preloadData!: boolean;

  @Column({ type: 'int', default: 50 })
  maxConcurrentRequests!: number;

  // Accessibility settings
  @Column({ type: 'boolean', default: false })
  highContrastMode!: boolean;

  @Column({ type: 'boolean', default: false })
  reducedMotion!: boolean;

  @Column({ type: 'int', default: 16 })
  fontSize!: number; // in px

  @Column({ type: 'boolean', default: false })
  screenReaderEnabled!: boolean;

  // Custom settings (JSON for extensibility)
  @Column({ type: 'json', nullable: true })
  customSettings?: any;

  // Metadata
  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToOne(() => User, user => user.settings)
  user!: User;

  // Helper methods
  public getServiceRefreshInterval(serviceName: string): number {
    if (this.serviceRefreshIntervals && this.serviceRefreshIntervals[serviceName]) {
      return this.serviceRefreshIntervals[serviceName];
    }
    return this.defaultRefreshInterval;
  }

  public isServiceFavorite(serviceName: string): boolean {
    return !!(this.favoriteServices && this.favoriteServices.includes(serviceName));
  }

  public isServiceHidden(serviceName: string): boolean {
    return !!(this.hiddenServices && this.hiddenServices.includes(serviceName));
  }

  public addFavoriteService(serviceName: string): void {
    if (!this.favoriteServices) {
      this.favoriteServices = [];
    }
    if (!this.favoriteServices.includes(serviceName)) {
      this.favoriteServices.push(serviceName);
    }
  }

  public removeFavoriteService(serviceName: string): void {
    if (this.favoriteServices) {
      this.favoriteServices = this.favoriteServices.filter(s => s !== serviceName);
    }
  }

  public hideService(serviceName: string): void {
    if (!this.hiddenServices) {
      this.hiddenServices = [];
    }
    if (!this.hiddenServices.includes(serviceName)) {
      this.hiddenServices.push(serviceName);
      // Remove from favorites if it's there
      this.removeFavoriteService(serviceName);
    }
  }

  public showService(serviceName: string): void {
    if (this.hiddenServices) {
      this.hiddenServices = this.hiddenServices.filter(s => s !== serviceName);
    }
  }

  public setCustomSetting(key: string, value: any): void {
    if (!this.customSettings) {
      this.customSettings = {};
    }
    this.customSettings[key] = value;
  }

  public getCustomSetting(key: string): any {
    return this.customSettings ? this.customSettings[key] : undefined;
  }

  public removeCustomSetting(key: string): void {
    if (this.customSettings) {
      delete this.customSettings[key];
    }
  }

  // Default settings factory method
  public static createDefaultSettings(): UserSettings {
    const settings = new UserSettings();

    // Set default values for all properties
    settings.theme = Theme.AUTO;
    settings.language = Language.EN;
    settings.timezone = 'UTC';
    settings.dateFormat = DateFormat.MM_DD_YYYY;
    settings.timeFormat = TimeFormat.HOUR_12;
    settings.dashboardLayout = null;
    settings.showWelcomeMessage = true;
    settings.showQuickActions = true;
    settings.compactView = false;
    settings.itemsPerPage = 10;
    settings.emailNotifications = NotificationLevel.ALL;
    settings.pushNotifications = NotificationLevel.IMPORTANT;
    settings.notifyOnServiceDown = true;
    settings.notifyOnServiceUp = true;
    settings.notifyOnUpdates = false;
    settings.notifyOnSecurityAlerts = true;
    settings.serviceRefreshIntervals = {};
    settings.autoRefreshEnabled = true;
    settings.defaultRefreshInterval = 30;
    settings.favoriteServices = [];
    settings.hiddenServices = [];
    settings.allowDataCollection = false;
    settings.showOnlineStatus = true;
    settings.profileVisibleToPublic = false;
    settings.enableAnimations = true;
    settings.preloadData = true;
    settings.maxConcurrentRequests = 50;
    settings.highContrastMode = false;
    settings.reducedMotion = false;
    settings.fontSize = 16;
    settings.screenReaderEnabled = false;
    settings.customSettings = {};

    return settings;
  }
}