import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';

export type ChatDocument = Chat & Document;

export enum ChatType {
  Private = 'private',
  Group = 'group',
}

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Chat {
  @ApiProperty({
    description: 'Loại chat',
    enum: ChatType,
    example: ChatType.Private,
  })
  @Prop({
    type: String,
    enum: Object.values(ChatType),
    required: true,
  })
  chat_type: ChatType;

  @ApiProperty({
    description: 'ID nhóm (nếu là group chat)',
    type: String,
    nullable: true,
  })
  @Prop({ type: Types.ObjectId, ref: 'Group', default: null })
  group_id: Types.ObjectId | null;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);

// Index để query chats theo group hay ngày cập nhật
ChatSchema.index({ group_id: 1 });
ChatSchema.index({ updatedAt: -1 });
