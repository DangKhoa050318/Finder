import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';

export type SlotDocument = Slot & Document;

export enum SlotType {
  Group = 'group',
  Private = 'private',
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
}

export const SlotSchema = SchemaFactory.createForClass(Slot);

// Index để query slots theo người tạo và thời gian
SlotSchema.index({ created_by: 1 });
SlotSchema.index({ start_time: 1 });
SlotSchema.index({ slot_type: 1 });
