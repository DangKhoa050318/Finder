import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UserService } from './services/user.service';
import { MajorService } from './services/major.service';
import { CourseService } from './services/course.service';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { GlobalModule } from './shared/global.module';
import { ConfigService } from './shared/config.service';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  const userService = app.get(UserService);
  await userService.createAdminIfNotExists(); // Gọi hàm tạo admin

  const majorService = app.get(MajorService);
  await majorService.createDefaultMajors(); // Gọi hàm tạo majors

  const courseService = app.get(CourseService);
  await courseService.createDefaultCourses(); // Gọi hàm tạo courses

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Study Together API')
    .setDescription('API documentation')
    .setVersion('1.0')
    .build();

  const cfg = app.select(GlobalModule).get(ConfigService);
  app.setGlobalPrefix(cfg.env.prefix);
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(cfg.env.swaggerPath, app, document);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      enableDebugMessages: true,
    }),
  );

  app.listen(cfg.env.port, () => {
    console.log(
      `🚀[SERVER] Documentation http://localhost:${cfg.env.port}${cfg.env.swaggerPath}`,
    );
    console.log(
      `🚀[SERVER] Running on http://localhost:${cfg.env.port}${cfg.env.prefix}`,
    );
  });
}
bootstrap();
