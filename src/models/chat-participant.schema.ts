import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';

export type ChatParticipantDocument = ChatParticipant & Document;

export enum ChatParticipantRole {
  Leader = 'leader',
  Member = 'member',
  Private = 'private',
}

@Schema({
  timestamps: true,
  versionKey: false,
})
export class ChatParticipant {
  @ApiProperty({
    description: 'ID chat',
    type: String,
  })
  @Prop({ type: Types.ObjectId, ref: 'Chat', required: true })
  chat_id: Types.ObjectId;

  @ApiProperty({
    description: 'ID người tham gia',
    type: String,
  })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user_id: Types.ObjectId;

  @ApiProperty({
    description: 'Vai trò trong chat',
    enum: ChatParticipantRole,
    example: ChatParticipantRole.Private,
  })
  @Prop({
    type: String,
    enum: Object.values(ChatParticipantRole),
    default: ChatParticipantRole.Private,
  })
  role: ChatParticipantRole;
}

export const ChatParticipantSchema = SchemaFactory.createForClass(ChatParticipant);

// Compound index để đảm bảo user không join chat 2 lần
ChatParticipantSchema.index({ chat_id: 1, user_id: 1 }, { unique: true });
// Index để query participants của chat
ChatParticipantSchema.index({ chat_id: 1 });
// Index để query chats của user - sparse để cho phép null trong dev
ChatParticipantSchema.index({ user_id: 1 }, { sparse: true });
