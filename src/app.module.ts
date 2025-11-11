import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthController } from './controllers/auth.controller';
import { MajorController } from './controllers/major.controller';
import { CourseController } from './controllers/course.controller';
import { MajorCourseController } from './controllers/major_course.controller';
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
import { MajorCourseService } from './services/major_course.service';
import { UserService } from './services/user.service';
import { ConfigService } from './shared/config.service';
import { GlobalModule } from './shared/global.module';
import { Availability, AvailabilitySchema } from './models/availability.schema';
import { AvailabilityService } from './services/availability.service';
import { AvailabilityController } from './controllers/availability.controller';
// New controllers
import { FriendController } from './controllers/friend.controller';
import { ReportController } from './controllers/report.controller';
import { BlockController } from './controllers/block.controller';
import { NewsController } from './controllers/news.controller';
import { BanController } from './controllers/ban.controller';
import { GroupController } from './controllers/group.controller';
import { SlotController } from './controllers/slot.controller';
import { AttendanceController } from './controllers/attendance.controller';
import { TaskController } from './controllers/task.controller';
import { ReminderController } from './controllers/reminder.controller';
import { ChatController } from './controllers/chat.controller';
import { MessageController } from './controllers/message.controller';
import { GroupDocumentController } from './controllers/group-document.controller';
// New schemas
import {
  FriendRequest,
  FriendRequestSchema,
} from './models/friend-request.schema';
import { Friendship, FriendshipSchema } from './models/friendship.schema';
import { Report, ReportSchema } from './models/report.schema';
import { Block, BlockSchema } from './models/block.schema';
import { News, NewsSchema } from './models/news.schema';
import { Ban, BanSchema } from './models/ban.schema';
import { Group, GroupSchema } from './models/group.schema';
import { GroupMember, GroupMemberSchema } from './models/group-member.schema';
import { Chat, ChatSchema } from './models/chat.schema';
import {
  ChatParticipant,
  ChatParticipantSchema,
} from './models/chat-participant.schema';
import { Message, MessageSchema } from './models/message.schema';
import { Slot, SlotSchema } from './models/slot.schema';
import { SlotGroup, SlotGroupSchema } from './models/slot-group.schema';
import { SlotPrivate, SlotPrivateSchema } from './models/slot-private.schema';
import { Attendance, AttendanceSchema } from './models/attendance.schema';
import { Task, TaskSchema } from './models/task.schema';
import { Reminder, ReminderSchema } from './models/reminder.schema';
import { Notification, NotificationSchema } from './models/notification.schema';
import { GroupDocument, GroupDocumentSchema } from './models/group-document.schema';
// New services
import { FriendService } from './services/friend.service';
import { ReportService } from './services/report.service';
import { BlockService } from './services/block.service';
import { NewsService } from './services/news.service';
import { BanService } from './services/ban.service';
import { GroupService } from './services/group.service';
import { SlotService } from './services/slot.service';
import { AttendanceService } from './services/attendance.service';
import { TaskService } from './services/task.service';
import { ReminderService } from './services/reminder.service';
import { ChatService } from './services/chat.service';
import { MessageService } from './services/message.service';
import { GroupDocumentService } from './services/group-document.service';
import { EmailService } from './services/email.service';
// WebSocket Gateways
import { ChatGateway } from './gateways/chat.gateway';
import { NotificationGateway } from './gateways/notification.gateway';
// Cron Jobs Module
import { TasksModule } from './tasks/tasks.module';
import { NotificationService } from './services/notification.service';
import { NotificationController } from './controllers/notification.controller';
// Upload Module
import { UploadModule } from './modules/upload/upload.module';

@Module({
  imports: [
    GlobalModule,
    TasksModule,
    UploadModule,
    MongooseModule.forRootAsync({
      useFactory: (cfg: ConfigService) => {
        return {
          uri: cfg.env.mongoUri,
          autoIndex: false, // Disable auto index sync to prevent overwriting sparse indexes
        };
      },
      inject: [ConfigService],
    }),

    UserSchemaModule,
    MongooseModule.forFeature([
      // Existing schemas
      { name: Course.name, schema: CourseSchema },
      { name: Major.name, schema: MajorSchema },
      { name: MajorCourse.name, schema: MajorCourseSchema },
      { name: Availability.name, schema: AvailabilitySchema },
      // New schemas
      { name: FriendRequest.name, schema: FriendRequestSchema },
      { name: Friendship.name, schema: FriendshipSchema },
      { name: Report.name, schema: ReportSchema },
      { name: Block.name, schema: BlockSchema },
      { name: News.name, schema: NewsSchema },
      { name: Ban.name, schema: BanSchema },
      { name: Group.name, schema: GroupSchema },
      { name: GroupMember.name, schema: GroupMemberSchema },
      { name: Chat.name, schema: ChatSchema },
      { name: ChatParticipant.name, schema: ChatParticipantSchema },
      { name: Message.name, schema: MessageSchema },
      { name: Slot.name, schema: SlotSchema },
      { name: SlotGroup.name, schema: SlotGroupSchema },
      { name: SlotPrivate.name, schema: SlotPrivateSchema },
      { name: Attendance.name, schema: AttendanceSchema },
      { name: Task.name, schema: TaskSchema },
      { name: Reminder.name, schema: ReminderSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: GroupDocument.name, schema: GroupDocumentSchema },
    ]),
  ],
  controllers: [
    AuthController,
    UserController,
    MajorController,
    CourseController,
    MajorCourseController,
    AvailabilityController,
    FriendController,
    ReportController,
    BlockController,
    NewsController,
    BanController,
    GroupController,
    SlotController,
    AttendanceController,
    TaskController,
    ReminderController,
    ChatController,
    MessageController,
    GroupDocumentController,
    NotificationController,
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
    MajorCourseService,
    AuthService,
    AvailabilityService,
    FriendService,
    ReportService,
    BlockService,
    NewsService,
    BanService,
    GroupService,
    SlotService,
    AttendanceService,
    TaskService,
    ReminderService,
    ChatService,
    MessageService,
    GroupDocumentService,
    EmailService,
    ChatGateway,
    NotificationGateway,
    NotificationService,
  ],
})
export class AppModule {}
