import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';

export type FriendshipDocument = Friendship & Document;

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Friendship {
  @ApiProperty({
    description: 'ID user thứ nhất',
    type: String,
  })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user1_id: Types.ObjectId;

  @ApiProperty({
    description: 'ID user thứ hai',
    type: String,
  })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user2_id: Types.ObjectId;
}

export const FriendshipSchema = SchemaFactory.createForClass(Friendship);

FriendshipSchema.index({ user1_id: 1, user2_id: 1 }, { unique: true });
