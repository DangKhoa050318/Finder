import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import { migrateTimestamps, rollbackTimestamps } from './migrations/rename-timestamps.migration';

/**
 * Migration runner script
 * 
 * Usage:
 * npm run migration:run
 * npm run migration:rollback
 */

async function runMigration() {
  console.log('🔧 Initializing NestJS application for migration...\n');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    // Get MongoDB connection
    const connection = app.get<Connection>(getConnectionToken());
    console.log('✅ Connected to MongoDB:', connection.name, '\n');

    // Check if rollback mode
    const isRollback = process.argv.includes('--rollback');

    if (isRollback) {
      console.log('⚠️  ROLLBACK MODE - This will revert camelCase back to snake_case\n');
      await rollbackTimestamps(connection);
    } else {
      console.log('📝 Running migration: Rename timestamps to camelCase\n');
      await migrateTimestamps(connection);
    }

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await app.close();
    console.log('\n👋 Closing application...');
  }
}

// Run the migration
runMigration()
  .then(() => {
    console.log('✅ Process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
