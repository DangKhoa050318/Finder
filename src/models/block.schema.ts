import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';

export type BlockDocument = Block & Document;

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Block {
  @ApiProperty({
    description: 'ID người chặn',
    type: String,
  })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  blocker_id: Types.ObjectId;

  @ApiProperty({
    description: 'ID người bị chặn',
    type: String,
  })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  blocked_id: Types.ObjectId;

  @ApiProperty({
    description: 'Ngày chặn',
    example: '2025-10-17T00:00:00.000Z',
  })
  @Prop({ type: Date, default: Date.now })
  created_at: Date;
}

export const BlockSchema = SchemaFactory.createForClass(Block);


BlockSchema.index({ blocker_id: 1, blocked_id: 1 }, { unique: true });
