import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UserService } from './services/user.service';
import { MajorService } from './services/major.service';
import { CourseService } from './services/course.service';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { GlobalModule } from './shared/global.module';
import { ConfigService } from './shared/config.service';
import { ValidationPipe } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  const majorService = app.get(MajorService);
  await majorService.createDefaultMajors(); // Gọi hàm tạo majors

  const courseService = app.get(CourseService);
  await courseService.createDefaultCourses(); // Gọi hàm tạo courses

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Study Together API')
    .setDescription('API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const cfg = app.select(GlobalModule).get(ConfigService);
  app.setGlobalPrefix(cfg.env.prefix);
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(cfg.env.swaggerPath, app, document, {
    jsonDocumentUrl: `${cfg.env.swaggerPath}-json`,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      enableDebugMessages: true,
      transformOptions: {
        enableImplicitConversion: true,
        exposeDefaultValues: true,
        exposeUnsetFields: false,
      },
    }),
  );

  app.listen(cfg.env.port, async () => {
    console.log(
      `🚀[SERVER] Documentation http://localhost:${cfg.env.port}${cfg.env.swaggerPath}`,
    );
    console.log(
      `🚀[SERVER] Running on http://localhost:${cfg.env.port}${cfg.env.prefix}`,
    );

    // FIX: Drop old non-sparse index AFTER Mongoose has created indexes
    setTimeout(async () => {
      try {
        const connection = app.get<Connection>(getConnectionToken());
        const collection = connection.collection('chatparticipants');
        
        // Drop tất cả indexes trên user_id
        try {
          await collection.dropIndex('user_id_1');
          console.log('✅ Dropped old user_id_1 index');
        } catch (err) {
          console.log('ℹ️ Index user_id_1 không tồn tại');
        }
        
        // Tạo lại index với sparse: true
        await collection.createIndex({ user_id: 1 }, { sparse: true, name: 'user_id_1' });
        console.log('✅ Created new sparse index on user_id');
      } catch (error) {
        console.error('❌ Error fixing index:', error.message);
      }
    }, 2000); // Đợi 2 giây để Mongoose tạo index xong
  });
}
bootstrap();
