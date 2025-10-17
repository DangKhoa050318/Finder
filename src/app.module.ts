import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthController } from './controllers/auth.controller';
import { MajorController } from './controllers/major.controller';
import { UserController } from './controllers/user.controller';
import { AllExceptionFilter } from './exceptions/all.exception';
import { HttpExceptionFilter } from './exceptions/http.exception';
import { MongoExceptionFilter } from './exceptions/mongo.exception';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { TransformInterceptor } from './interceptors/transform.interceptor';
import { Course, CourseSchema } from './models/course.schema';
import { Major, MajorSchema } from './models/major.schema';
import { MajorCourse, MajorCourseSchema } from './models/major_course.schema';
import { UserSchemaModule } from './models/user.schema';
import { AuthService } from './services/auth.service';
import { CourseService } from './services/course.service';
import { MajorService } from './services/major.service';
import { UserService } from './services/user.service';
import { ConfigService } from './shared/config.service';
import { GlobalModule } from './shared/global.module';
import { Availability, AvailabilitySchema } from './models/availability.schema';
import { AvailabilityService } from './services/availability.service';
import { AvailabilityController } from './controllers/availability.controller';

@Module({
  imports: [
    GlobalModule,
    MongooseModule.forRootAsync({
      useFactory: (cfg: ConfigService) => {
        return {
          uri: cfg.env.mongoUri,
        };
      },
      inject: [ConfigService],
    }),

    UserSchemaModule,
    MongooseModule.forFeature([
      { name: Course.name, schema: CourseSchema },
      { name: Major.name, schema: MajorSchema },
      { name: MajorCourse.name, schema: MajorCourseSchema },
      { name: Availability.name, schema: AvailabilitySchema },
    ]),
  ],
  controllers: [
    AuthController,
    UserController,
    MajorController,
    AvailabilityController,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: MongoExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    UserService,
    MajorService,
    CourseService,
    AuthService,
    AvailabilityService,
    // ...other services...
  ],
})
export class AppModule {}
