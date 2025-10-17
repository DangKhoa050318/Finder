import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UserService } from './services/user.service';
import { MajorService } from './services/major.service';
import { CourseService } from './services/course.service';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

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
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port);
}
bootstrap();
