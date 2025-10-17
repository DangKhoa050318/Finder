import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';

export type TaskDocument = Task & Document;

export enum TaskStatus {
  Todo = 'todo',
  InProgress = 'in_progress',
  Done = 'done',
  Cancelled = 'cancelled',
}

export enum TaskPriority {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
}

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Task {
  @ApiProperty({
    description: 'Tiêu đề task',
    example: 'Complete homework Chapter 5',
  })
  @Prop({ required: true })
  title: string;

  @ApiProperty({
    description: 'Mô tả task',
    example: 'Solve exercises 1-10',
  })
  @Prop({ default: '' })
  description: string;

  @ApiProperty({
    description: 'Ngày tạo',
    example: '2025-10-17T00:00:00.000Z',
  })
  @Prop({ type: Date, default: Date.now })
  created_at: Date;

  @ApiProperty({
    description: 'Hạn hoàn thành',
    example: '2025-10-20T00:00:00.000Z',
    nullable: true,
  })
  @Prop({ type: Date, default: null })
  due_date: Date | null;

  @ApiProperty({
    description: 'ID người tạo',
    type: String,
  })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  created_by: Types.ObjectId;

  @ApiProperty({
    description: 'ID slot (nếu task thuộc slot)',
    type: String,
    nullable: true,
  })
  @Prop({ type: Types.ObjectId, ref: 'Slot', default: null })
  slot_id: Types.ObjectId | null;

  @ApiProperty({
    description: 'Trạng thái task',
    enum: TaskStatus,
    example: TaskStatus.Todo,
  })
  @Prop({
    type: String,
    enum: Object.values(TaskStatus),
    default: TaskStatus.Todo,
  })
  status: TaskStatus;

  @ApiProperty({
    description: 'Độ ưu tiên',
    enum: TaskPriority,
    example: TaskPriority.Medium,
  })
  @Prop({
    type: String,
    enum: Object.values(TaskPriority),
    default: TaskPriority.Medium,
  })
  priority: TaskPriority;
}

export const TaskSchema = SchemaFactory.createForClass(Task);

// Index để query tasks theo người tạo, slot, status
TaskSchema.index({ created_by: 1 });
TaskSchema.index({ slot_id: 1 });
TaskSchema.index({ status: 1 });
TaskSchema.index({ due_date: 1 });
