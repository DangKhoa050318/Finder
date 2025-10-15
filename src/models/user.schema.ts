import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import * as bcrypt from 'bcrypt';
import { Document, Types } from 'mongoose';
import { ConfigService } from 'src/shared/config.service';
export type UserDocument = User & Document;

export enum Role {
  Admin = 'Admin',
  User = 'User',
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
  full_name: string;

  @ApiProperty({
    example: 'admin123@gmail.com',
    description: 'Email của người dùng',
  })
  @Prop({ required: true, unique: true })
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'Mật khẩu của người dùng',
  })
  @Prop({ required: true })
  password: string;

  @ApiProperty({ default: null, type: 'string', format: 'ObjectId' })
  @Prop({ type: Types.ObjectId, ref: 'Major', default: null })
  major_id: Types.ObjectId;

  @ApiProperty({ default: Role.User, enum: Role })
  @Prop({ required: true, enum: Role, default: Role.User })
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
}
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
          next();
        } catch (error) {
          next(error);
        }
      });
      return UserSchema;
    },
    inject: [ConfigService],
  },
]);
export const UserSchema = SchemaFactory.createForClass(User);
