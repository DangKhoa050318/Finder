import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';

export type ReminderDocument = Reminder & Document;

export enum ReminderMethod {
  Email = 'email',
  InApp = 'in_app',
}

export enum ReminderStatus {
  Pending = 'pending',
  Sent = 'sent',
  Failed = 'failed',
}

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Reminder {
  @ApiProperty({
    description: 'ID slot',
    type: String,
  })
  @Prop({ type: Types.ObjectId, ref: 'Slot', required: true })
  slot_id: Types.ObjectId;

  @ApiProperty({
    description: 'ID người nhận reminder',
    type: String,
  })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user_id: Types.ObjectId;

  @ApiProperty({
    description: 'Thời gian gửi reminder',
    example: '2025-10-17T13:55:00.000Z',
  })
  @Prop({ type: Date, required: true })
  remind_at: Date;

  @ApiProperty({
    description: 'Ngày tạo reminder',
    example: '2025-10-17T00:00:00.000Z',
  })
  @Prop({ type: Date, default: Date.now })
  created_at: Date;

  @ApiProperty({
    description: 'Phương thức thông báo',
    enum: ReminderMethod,
    example: ReminderMethod.InApp,
  })
  @Prop({
    type: String,
    enum: Object.values(ReminderMethod),
    default: ReminderMethod.InApp,
  })
  method: ReminderMethod;

  @ApiProperty({
    description: 'Nội dung thông báo',
    example: 'Your study session starts in 5 minutes!',
  })
  @Prop({ required: true })
  message: string;

  @ApiProperty({
    description: 'Trạng thái reminder',
    enum: ReminderStatus,
    example: ReminderStatus.Pending,
  })
  @Prop({
    type: String,
    enum: Object.values(ReminderStatus),
    default: ReminderStatus.Pending,
  })
  status: ReminderStatus;
}

export const ReminderSchema = SchemaFactory.createForClass(Reminder);

// Index để query reminders theo slot, user, và thời gian
ReminderSchema.index({ slot_id: 1 });
ReminderSchema.index({ user_id: 1 });
ReminderSchema.index({ remind_at: 1, status: 1 }); // For cron jobs
