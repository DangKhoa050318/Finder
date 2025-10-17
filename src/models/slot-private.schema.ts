import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';

export type SlotPrivateDocument = SlotPrivate & Document;

@Schema({
  timestamps: true,
  versionKey: false,
})
export class SlotPrivate {
  @ApiProperty({
    description: 'ID slot',
    type: String,
  })
  @Prop({ type: Types.ObjectId, ref: 'Slot', required: true })
  slot_id: Types.ObjectId;

  @ApiProperty({
    description: 'ID người dùng thứ nhất',
    type: String,
  })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user1_id: Types.ObjectId;

  @ApiProperty({
    description: 'ID người dùng thứ hai',
    type: String,
  })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user2_id: Types.ObjectId;
}

export const SlotPrivateSchema = SchemaFactory.createForClass(SlotPrivate);

// Unique index cho slot_id vì mỗi slot private chỉ có 1 record
SlotPrivateSchema.index({ slot_id: 1 }, { unique: true });
// Index để query private slots của user
SlotPrivateSchema.index({ user1_id: 1 });
SlotPrivateSchema.index({ user2_id: 1 });
