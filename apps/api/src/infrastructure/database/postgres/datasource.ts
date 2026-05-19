import { DataSource } from 'typeorm';

// Datasource used by TypeORM CLI for migrations — env vars must be set in shell
// Usage: DATABASE_URL=... pnpm migration:run
export default new DataSource({
  type: 'postgres',
  url: process.env['DATABASE_URL'],
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/infrastructure/database/postgres/migrations/*.ts'],
  migrationsTableName: 'typeorm_migrations',
});
