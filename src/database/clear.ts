import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

async function clearDatabase() {
  console.log('🗑️  Bắt đầu xóa toàn bộ database...\n');

  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const connection = app.get<Connection>(getConnectionToken());

    if (!connection.db) {
      throw new Error('Database connection not established');
    }

    // Lấy tất cả collections
    const collections = await connection.db.collections();

    console.log(`📦 Tìm thấy ${collections.length} collections\n`);

    // Xóa từng collection
    for (const collection of collections) {
      const count = await collection.countDocuments();
      await collection.deleteMany({});
      console.log(
        `✅ Đã xóa ${count} documents từ collection: ${collection.collectionName}`,
      );
    }

    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║      🎉 ĐÃ XÓA TOÀN BỘ DATABASE!           ║');
    console.log('╚════════════════════════════════════════════╝\n');
  } catch (error) {
    console.error('❌ Lỗi khi xóa database:', error);
    throw error;
  } finally {
    await app.close();
  }
}

// Run clear
clearDatabase()
  .then(() => {
    console.log('✅ Clear script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Clear script failed:', error);
    process.exit(1);
  });
