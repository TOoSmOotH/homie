import { DataSource, DataSourceOptions } from 'typeorm';
import path from 'path';
import fs from 'fs';
import { config } from '../config';
import { logger } from '../utils/logger';

// Entities
import { User } from '../models/User';
import { UserSettings } from '../models/UserSettings';
import { Service } from '../models/Service';
import { ServiceDefinition } from '../models/ServiceDefinition';
import { ServiceConfig } from '../models/ServiceConfig';
import { AppPreferences } from '../models/AppPreferences';

class DBConnection {
  private dataSource: DataSource | null = null;
  private initialized = false;

  private buildOptions(): DataSourceOptions {
    const dbFile = path.isAbsolute(config.dbPath)
      ? config.dbPath
      : path.join(process.cwd(), config.dbPath);

    const dir = path.dirname(dbFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const synchronizeEnv = process.env.DB_SYNCHRONIZE;
    const synchronize = synchronizeEnv
      ? synchronizeEnv === 'true'
      : true; // default true to ensure fresh DBs are created

    return {
      type: 'sqlite',
      database: dbFile,
      entities: [User, UserSettings, Service, ServiceDefinition, ServiceConfig, AppPreferences],
      migrations: [],
      logging: false,
      synchronize,
    } as DataSourceOptions;
  }

  public async initialize(): Promise<void> {
    if (this.initialized && this.dataSource) return;

    const options = this.buildOptions();
    this.dataSource = new DataSource(options);

    try {
      await this.dataSource.initialize();
      this.initialized = true;
      logger.info('✅ Database initialized');
    } catch (err) {
      logger.error('❌ Failed to initialize database', err);
      throw err;
    }
  }

  public getDataSource(): DataSource {
    if (!this.dataSource || !this.initialized) {
      throw new Error('Database not initialized');
    }
    return this.dataSource;
  }

  public async runMigrations(): Promise<void> {
    if (!this.dataSource) throw new Error('Database not initialized');

    // If no migrations are defined, ensure schema via synchronize on demand
    if (!this.dataSource.migrations || this.dataSource.migrations.length === 0) {
      if (!this.dataSource.options.synchronize) {
        // Run a one-off schema sync to create tables in production if needed
        // TypeORM v0.3: use build schema via `synchronize` by recreating a temp DataSource
        try {
          logger.info('No migrations found; performing schema synchronization');
          await this.dataSource.synchronize();
        } catch (e) {
          logger.error('Schema synchronization failed', e);
          throw e;
        }
      }
      return;
    }

    try {
      await this.dataSource.runMigrations();
      logger.info('Database migrations executed');
    } catch (e) {
      logger.error('Failed to run migrations', e);
      throw e;
    }
  }

  public async close(): Promise<void> {
    if (this.dataSource && this.dataSource.isInitialized) {
      await this.dataSource.destroy();
      this.initialized = false;
      this.dataSource = null;
    }
  }
}

export const dbConnection = new DBConnection();

