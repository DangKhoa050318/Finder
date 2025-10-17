import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';

export type AttendanceDocument = Attendance & Document;

export enum AttendanceStatus {
  Registered = 'registered',
  Attending = 'attending',
  Completed = 'completed',
  Absent = 'absent',
}

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Attendance {
  @ApiProperty({
    description: 'ID người dùng',
    type: String,
  })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user_id: Types.ObjectId;

  @ApiProperty({
    description: 'ID slot',
    type: String,
  })
  @Prop({ type: Types.ObjectId, ref: 'Slot', required: true })
  slot_id: Types.ObjectId;

  @ApiProperty({
    description: 'Trạng thái tham gia',
    enum: AttendanceStatus,
    example: AttendanceStatus.Registered,
  })
  @Prop({
    type: String,
    enum: Object.values(AttendanceStatus),
    default: AttendanceStatus.Registered,
  })
  status: AttendanceStatus;

  @ApiProperty({
    description: 'Thời gian bắt đầu tham gia',
    example: '2025-10-17T14:00:00.000Z',
    nullable: true,
  })
  @Prop({ type: Date, default: null })
  started_at: Date | null;

  @ApiProperty({
    description: 'Thời gian rời khỏi',
    example: '2025-10-17T16:00:00.000Z',
    nullable: true,
  })
  @Prop({ type: Date, default: null })
  left_at: Date | null;
}

export const AttendanceSchema = SchemaFactory.createForClass(Attendance);

// Compound index để đảm bảo user không đăng ký slot 2 lần
AttendanceSchema.index({ user_id: 1, slot_id: 1 }, { unique: true });
// Index để query attendances theo slot
AttendanceSchema.index({ slot_id: 1 });
