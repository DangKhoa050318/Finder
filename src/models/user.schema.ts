import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ConfigService } from 'src/shared/config.service';
import * as bcrypt from 'bcrypt';
import { Expose } from 'class-transformer';
export type UserDocument = User & Document;

export enum Role {
  Admin = 'Admin',
  User = 'User',
}

@Schema({
  timestamps: true,
  versionKey: false,
})
export class User {
  @Prop({ required: true })
  full_name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ type: Types.ObjectId, ref: 'Major', default: null })
  major_id: Types.ObjectId;

  @Prop({ required: true, enum: Role, default: Role.User })
  role: Role;
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
