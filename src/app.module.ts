import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthController } from './controllers/auth.controller';
import { MajorController } from './controllers/major.controller';
import { Course, CourseSchema } from './models/course.schema';
import { Major, MajorSchema } from './models/major.schema';
import { MajorCourse, MajorCourseSchema } from './models/major_course.schema';
import { User, UserSchema, UserSchemaModule } from './models/user.schema';
import { AuthService } from './services/auth.service';
import { ConfigService } from './shared/config.service';
import { CourseService } from './services/course.service';
import { MajorService } from './services/major.service';
import { UserService } from './services/user.service';
import { GlobalModule } from './shared/global.module';

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
    ]),
  ],
  controllers: [
    AuthController,
    MajorController, // Thêm dòng này
  ],
  providers: [
    UserService,
    MajorService,
    CourseService,
    AuthService,
    // ...other services...
  ],
})
export class AppModule {}
