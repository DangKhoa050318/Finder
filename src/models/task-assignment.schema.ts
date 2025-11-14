import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';

export type TaskAssignmentDocument = TaskAssignment & Document;

export enum AssignmentStatus {
  Pending = 'pending',       // Chưa bắt đầu
  InProgress = 'in_progress', // Đang làm
  Completed = 'completed',    // Đã hoàn thành
  Cancelled = 'cancelled',    // Đã hủy
}

@Schema({
  timestamps: true,
  versionKey: false,
})
export class TaskAssignment {
  @ApiProperty({
    description: 'ID task được assign',
    type: String,
  })
  @Prop({ type: Types.ObjectId, ref: 'Task', required: true })
  task_id: Types.ObjectId;

  @ApiProperty({
    description: 'ID user được assign task',
    type: String,
  })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user_id: Types.ObjectId;

  @ApiProperty({
    description: 'ID người assign task (thường là leader hoặc creator)',
    type: String,
  })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  assigned_by: Types.ObjectId;

  @ApiProperty({
    description: 'Trạng thái assignment',
    enum: AssignmentStatus,
    example: AssignmentStatus.Pending,
  })
  @Prop({
    type: String,
    enum: Object.values(AssignmentStatus),
    default: AssignmentStatus.Pending,
  })
  status: AssignmentStatus;

  @ApiProperty({
    description: 'Thời gian bắt đầu làm task',
    nullable: true,
  })
  @Prop({ type: Date, default: null })
  started_at: Date | null;

  @ApiProperty({
    description: 'Thời gian hoàn thành task',
    nullable: true,
  })
  @Prop({ type: Date, default: null })
  completed_at: Date | null;

  @ApiProperty({
    description: 'Ghi chú của user khi hoàn thành',
    nullable: true,
  })
  @Prop({ type: String, default: null })
  completion_note: string | null;
}

export const TaskAssignmentSchema = SchemaFactory.createForClass(TaskAssignment);

// Indexes
TaskAssignmentSchema.index({ task_id: 1 });
TaskAssignmentSchema.index({ user_id: 1 });
TaskAssignmentSchema.index({ task_id: 1, user_id: 1 }, { unique: true }); // Một user chỉ được assign 1 lần cho 1 task
TaskAssignmentSchema.index({ status: 1 });
