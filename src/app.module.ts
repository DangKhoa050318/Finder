import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './controllers/app.controller';
import { AppService } from './app.service';
import { JwtModule } from '@nestjs/jwt';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

import { User, UserSchema } from './models/user.schema';
import { Course, CourseSchema } from './models/course.schema';
import { Major, MajorSchema } from './models/major.schema';
import { MajorCourse, MajorCourseSchema } from './models/major_course.schema';
import { UserService } from './services/user.service';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';
import { MajorService } from './services/major.service';
import { CourseService } from './services/course.service';
import { MajorController } from './controllers/major.controller';
import { Availability, AvailabilitySchema } from './models/availability.schema';
import { AvailabilityService } from './services/availability.service';
import { AvailabilityController } from './controllers/availability.controller';
import { UserController } from './controllers/user.controller';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/study_together'),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Course.name, schema: CourseSchema },
      { name: Major.name, schema: MajorSchema },
      { name: MajorCourse.name, schema: MajorCourseSchema },
      { name: Availability.name, schema: AvailabilitySchema },
    ]),
    JwtModule.register({
      secret: 'your_jwt_secret',
      signOptions: { expiresIn: '1d' },
    }),
    
  ],
  controllers: [
    AppController,
    AuthController,
    MajorController,
    AvailabilityController,
    UserController,
  ],
  providers: [
    AppService,
    UserService,
    MajorService,
    CourseService,
    AuthService,
    AvailabilityService,
    // ...other services...
  ],
})
export class AppModule {}
