import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';

export type SlotDocument = Slot & Document;

export enum SlotType {
  Group = 'group',
  Private = 'private',
}

export enum SlotStatus {
  PENDING = 'pending',     // Chờ duyệt (member tạo)
  APPROVED = 'approved',   // Đã duyệt
  REJECTED = 'rejected',   // Từ chối
  ACTIVE = 'active',       // Đang diễn ra
}

class Attachment {
  @Prop({ required: true })
  filename: string;

  @Prop({ required: true })
  originalName: string;

  @Prop({ required: true })
  mimetype: string;

  @Prop({ required: true })
  size: number;

  @Prop({ required: true })
  url: string;
}

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Slot {
  @ApiProperty({
    description: 'Tiêu đề slot',
    example: 'Study Session - Chapter 5',
  })
  @Prop({ required: true })
  title: string;

  @ApiProperty({
    description: 'Mô tả slot',
    example: 'We will cover algorithms and data structures',
  })
  @Prop({ default: '' })
  description: string;

  @ApiProperty({
    description: 'Thời gian bắt đầu',
    example: '2025-10-17T14:00:00.000Z',
  })
  @Prop({ type: Date, required: true })
  start_time: Date;

  @ApiProperty({
    description: 'Thời gian kết thúc',
    example: '2025-10-17T16:00:00.000Z',
  })
  @Prop({ type: Date, required: true })
  end_time: Date;

  @ApiProperty({
    description: 'ID người tạo slot',
    type: String,
  })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  created_by: Types.ObjectId;

  @ApiProperty({
    description: 'Loại slot',
    enum: SlotType,
    example: SlotType.Group,
  })
  @Prop({
    type: String,
    enum: Object.values(SlotType),
    required: true,
  })
  slot_type: SlotType;

  @ApiProperty({
    description: 'Tệp đính kèm',
    type: [Attachment],
  })
  @Prop({ type: [Attachment], default: [] })
  attachments: Attachment[];

  @ApiProperty({
    description: 'Trạng thái slot',
    enum: SlotStatus,
    example: SlotStatus.APPROVED,
  })
  @Prop({
    type: String,
    enum: Object.values(SlotStatus),
    default: SlotStatus.APPROVED,
  })
  status: SlotStatus;

  @ApiProperty({
    description: 'ID người duyệt (leader)',
    type: String,
    nullable: true,
  })
  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  approved_by: Types.ObjectId | null;

  @ApiProperty({
    description: 'Thời gian duyệt',
    example: '2025-10-17T13:00:00.000Z',
    nullable: true,
  })
  @Prop({ type: Date, default: null })
  approved_at: Date | null;

  @ApiProperty({
    description: 'Lý do từ chối',
    nullable: true,
  })
  @Prop({ type: String, default: null })
  rejection_reason: string | null;
}

export const SlotSchema = SchemaFactory.createForClass(Slot);

// Index để query slots theo người tạo và thời gian
SlotSchema.index({ created_by: 1 });
SlotSchema.index({ start_time: 1 });
SlotSchema.index({ slot_type: 1 });
