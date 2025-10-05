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

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/study_together'), // Change DB name as needed
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Course.name, schema: CourseSchema },
      { name: Major.name, schema: MajorSchema },
      { name: MajorCourse.name, schema: MajorCourseSchema },
    ]),
    JwtModule.register({
      secret: 'your_jwt_secret', // đổi thành biến môi trường khi deploy
      signOptions: { expiresIn: '1d' },
    }),
    // ...other modules...
  ],
  controllers: [
    AppController,
    AuthController,
    MajorController, // Thêm dòng này
  ],
  providers: [
    AppService,
    UserService,
    MajorService,
    CourseService,
    AuthService,
    // ...other services...
  ],
})
export class AppModule {}