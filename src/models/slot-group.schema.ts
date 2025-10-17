import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';

export type SlotGroupDocument = SlotGroup & Document;

@Schema({
  timestamps: true,
  versionKey: false,
})
export class SlotGroup {
  @ApiProperty({
    description: 'ID nhóm',
    type: String,
  })
  @Prop({ type: Types.ObjectId, ref: 'Group', required: true })
  group_id: Types.ObjectId;

  @ApiProperty({
    description: 'ID slot',
    type: String,
  })
  @Prop({ type: Types.ObjectId, ref: 'Slot', required: true })
  slot_id: Types.ObjectId;
}

export const SlotGroupSchema = SchemaFactory.createForClass(SlotGroup);

// Compound index để đảm bảo slot không được thêm vào group 2 lần
SlotGroupSchema.index({ group_id: 1, slot_id: 1 }, { unique: true });
// Index để query slots của group
SlotGroupSchema.index({ group_id: 1 });
