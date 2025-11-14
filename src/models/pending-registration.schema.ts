import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PendingRegistrationDocument = PendingRegistration & Document;

@Schema({
  timestamps: true,
  versionKey: false,
})
export class PendingRegistration {
  @Prop({ required: true })
  full_name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ type: String, required: false })
  avatar?: string;

  @Prop({ type: String, required: true })
  otp: string;

  @Prop({ type: Date, required: true })
  otpExpiry: Date;

  @Prop({ type: String, default: 'local', enum: ['local', 'google'] })
  provider: string;

  @Prop({ type: String, required: false })
  googleId?: string;
}

export const PendingRegistrationSchema = SchemaFactory.createForClass(PendingRegistration);

export const PendingRegistrationSchemaModule = MongooseModule.forFeature([
  {
    name: PendingRegistration.name,
    schema: PendingRegistrationSchema,
  },
]);
