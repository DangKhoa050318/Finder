import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import * as bcrypt from 'bcrypt';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsMongoId,
  Length,
  MinLength,
} from 'class-validator';
import { Document, Types } from 'mongoose';
import { ConfigService } from 'src/shared/config.service';
export type UserDocument = User & Document;

export enum Role {
  Admin = 'Admin',
  User = 'User',
}

export enum TimeSlot {
  Morning = 'morning',
  Afternoon = 'afternoon',
  Night = 'night',
  Evening = 'evening',
}

export enum Day {
  Monday = 'monday',
  Tuesday = 'tuesday',
  Wednesday = 'wednesday',
  Thursday = 'thursday',
  Friday = 'friday',
  Saturday = 'saturday',
  Sunday = 'sunday',
}

@Schema({ _id: false, versionKey: false })
export class SchedulePreference {
  @ApiProperty({
    description: 'Các khung giờ học mong muốn',
    enum: TimeSlot,
    isArray: true,
    example: ['morning', 'afternoon'],
  })
  @IsArray()
  @IsEnum(TimeSlot, { each: true, message: 'Khung giờ không hợp lệ' })
  @Prop({ type: [String], enum: TimeSlot, default: [] })
  timeSlots: TimeSlot[];

  @ApiProperty({
    description: 'Các ngày trong tuần mong muốn',
    enum: Day,
    isArray: true,
    example: ['monday', 'wednesday', 'friday'],
  })
  @Prop({ type: [String], enum: Day, default: [] })
  @IsArray()
  @IsEnum(Day, { each: true, message: 'Ngày không hợp lệ' })
  days: Day[];
}

@Schema({ _id: false, versionKey: false })
export class UserStatus {
  @ApiProperty({ default: true })
  @Prop({ default: true })
  isNewUser: boolean;

  @ApiProperty({ default: false })
  @Prop({ default: false })
  isBlocked: boolean;
}

@Schema({
  timestamps: true,
  versionKey: false,
})
export class User {
  @ApiProperty({
    example: 'Nguyễn Văn A',
    description: 'Họ và tên của người dùng',
  })
  @Prop({ required: true })
  @Length(5, 50, {
    message: 'Họ và tên phải có độ dài từ 5 đến 50 ký tự',
  })
  full_name: string;

  @ApiProperty({
    example: 'admin123@gmail.com',
    description: 'Email của người dùng',
  })
  @Prop({ required: true, unique: true })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'Mật khẩu của người dùng',
  })
  @Prop({ required: true })
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
  password: string;

  @ApiProperty({
    example: 'https://example.com/avatar.jpg',
    description: 'URL avatar của người dùng',
    required: false,
  })
  @Prop({
    default: function () {
      return `https://api.dicebear.com/7.x/initials/svg?seed=${this.full_name}`;
    },
    type: String,
  })
  avatar: string;

  @ApiProperty({
    example: 'Tôi là sinh viên năm 3, thích học nhóm và chia sẻ kiến thức',
    description: 'Giới thiệu bản thân',
    required: false,
  })
  @Prop({ type: String, default: '' })
  bio: string;

  @ApiProperty({ default: null, type: 'string', format: 'ObjectId' })
  @Prop({ type: Types.ObjectId, ref: 'Major', default: null })
  @IsMongoId({ message: 'major_id phải là ObjectId hợp lệ' })
  major_id: Types.ObjectId;

  @ApiProperty({ default: Role.User, enum: Role })
  @Prop({ required: true, enum: Role, default: Role.User })
  @IsEnum(Role, { message: 'Role không hợp lệ' })
  role: Role;

  @ApiProperty({
    default: () => ({ isNewUser: true, isBlocked: false }),
    type: UserStatus,
  })
  @Prop({
    type: UserStatus,
    default: () => ({
      isNewUser: true,
      isBlocked: false,
    }),
  })
  status: UserStatus;

  @ApiProperty({
    description: 'Lịch học mong muốn của người dùng',
    type: SchedulePreference,
    required: false,
  })
  @Prop({
    type: SchedulePreference,
    default: () => ({
      timeSlots: [],
      days: [],
    }),
  })
  schedulePreference: SchedulePreference;

  comparePassword: (password: string) => Promise<boolean>;
}

export const UserSchema = SchemaFactory.createForClass(User);

export const UserSchemaModule = MongooseModule.forFeatureAsync([
  {
    name: User.name,
    useFactory: (cfg: ConfigService) => {
      const schema = UserSchema;

      schema.methods.comparePassword = async function (password: string) {
        return bcrypt.compare(password, this.password);
      };

      schema.pre('save', async function (next) {
        try {
          //* if user is new or password is modified
          if (this.isModified('password') || this.isNew) {
            this.password = await bcrypt.hash(this.password, 10);
          }
          // if user has completed profile, set isNewUser to false
          if (this.isModified('major_id') && this.status.isNewUser) {
            this.status.isNewUser = false;
          }

          next();
        } catch (error) {
          next(error);
        }
      });
      return schema;
    },
    inject: [ConfigService],
  },
]);

