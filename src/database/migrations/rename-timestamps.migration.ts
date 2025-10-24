import { Connection } from 'mongoose';

/**
 * Migration script to rename timestamp fields from snake_case to camelCase
 * Run this once after pulling the latest code changes
 * 
 * Changes:
 * - created_at → createdAt
 * - updated_at → updatedAt
 * 
 * Affected collections:
 * - blocks
 * - chats
 * - friendships
 * - groups
 * - messages
 * - news
 * - reminders
 * - slots
 * - tasks
 */

interface MigrationResult {
  collection: string;
  status: 'success' | 'already_migrated' | 'skipped' | 'error';
  count?: number;
  reason?: string;
  error?: string;
}

export async function migrateTimestamps(connection: Connection) {
  console.log('🚀 Starting timestamp migration...\n');

  const collections = [
    'blocks',
    'chats',
    'friendships',
    'groups',
    'messages',
    'news',
    'reminders',
    'slots',
    'tasks',
  ];

  const results: MigrationResult[] = [];

  for (const collectionName of collections) {
    try {
      const collection = connection.collection(collectionName);
      
      // Check if collection exists
      if (!connection.db) {
        console.log(`⏭️  Skipping ${collectionName} (database not connected)`);
        results.push({ collection: collectionName, status: 'skipped', reason: 'db not connected' });
        continue;
      }
      
      const collectionsList = await connection.db.listCollections({ name: collectionName }).toArray();
      if (collectionsList.length === 0) {
        console.log(`⏭️  Skipping ${collectionName} (collection doesn't exist)`);
        results.push({ collection: collectionName, status: 'skipped', reason: 'not found' });
        continue;
      }

      // Count documents with old field names
      const oldFieldCount = await collection.countDocuments({
        $or: [
          { created_at: { $exists: true } },
          { updated_at: { $exists: true } },
        ],
      });

      if (oldFieldCount === 0) {
        console.log(`✅ ${collectionName}: Already migrated (0 documents with old fields)`);
        results.push({ collection: collectionName, status: 'already_migrated', count: 0 });
        continue;
      }

      // Perform the rename operation
      const result = await collection.updateMany(
        {
          $or: [
            { created_at: { $exists: true } },
            { updated_at: { $exists: true } },
          ],
        },
        {
          $rename: {
            created_at: 'createdAt',
            updated_at: 'updatedAt',
          },
        },
      );

      console.log(
        `✅ ${collectionName}: Migrated ${result.modifiedCount} documents`,
      );
      results.push({
        collection: collectionName,
        status: 'success',
        count: result.modifiedCount,
      });
    } catch (error) {
      console.error(`❌ ${collectionName}: Migration failed`, error);
      results.push({
        collection: collectionName,
        status: 'error',
        error: error.message,
      });
    }
  }

  console.log('\n📊 Migration Summary:');
  console.log('='.repeat(50));

  const successful = results.filter((r) => r.status === 'success');
  const alreadyMigrated = results.filter((r) => r.status === 'already_migrated');
  const skipped = results.filter((r) => r.status === 'skipped');
  const failed = results.filter((r) => r.status === 'error');

  console.log(`✅ Successfully migrated: ${successful.length} collections`);
  successful.forEach((r) => {
    console.log(`   - ${r.collection}: ${r.count} documents`);
  });

  if (alreadyMigrated.length > 0) {
    console.log(`⏭️  Already migrated: ${alreadyMigrated.length} collections`);
    alreadyMigrated.forEach((r) => {
      console.log(`   - ${r.collection}`);
    });
  }

  if (skipped.length > 0) {
    console.log(`⏭️  Skipped: ${skipped.length} collections`);
    skipped.forEach((r) => {
      console.log(`   - ${r.collection}: ${r.reason}`);
    });
  }

  if (failed.length > 0) {
    console.log(`❌ Failed: ${failed.length} collections`);
    failed.forEach((r) => {
      console.log(`   - ${r.collection}: ${r.error}`);
    });
  }

  const totalMigrated = successful.reduce((sum, r) => sum + (r.count || 0), 0);
  console.log(`\n🎉 Total documents migrated: ${totalMigrated}`);

  return results;
}

/**
 * Rollback function (in case you need to revert)
 */
export async function rollbackTimestamps(connection: Connection) {
  console.log('⏪ Starting timestamp rollback...\n');

  const collections = [
    'blocks',
    'chats',
    'friendships',
    'groups',
    'messages',
    'news',
    'reminders',
    'slots',
    'tasks',
  ];

  for (const collectionName of collections) {
    try {
      const collection = connection.collection(collectionName);

      const result = await collection.updateMany(
        {
          $or: [
            { createdAt: { $exists: true } },
            { updatedAt: { $exists: true } },
          ],
        },
        {
          $rename: {
            createdAt: 'created_at',
            updatedAt: 'updated_at',
          },
        },
      );

      console.log(
        `✅ ${collectionName}: Rolled back ${result.modifiedCount} documents`,
      );
    } catch (error) {
      console.error(`❌ ${collectionName}: Rollback failed`, error);
    }
  }

  console.log('\n✅ Rollback completed');
}
