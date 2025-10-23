import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';

export type MessageDocument = Message & Document;

export enum MessageStatus {
  Sent = 'sent',
  Delivered = 'delivered',
  Read = 'read',
}

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Message {
  @ApiProperty({
    description: 'ID chat',
    type: String,
  })
  @Prop({ type: Types.ObjectId, ref: 'Chat', required: true })
  chat_id: Types.ObjectId;

  @ApiProperty({
    description: 'ID người gửi',
    type: String,
  })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sender_id: Types.ObjectId;

  @ApiProperty({
    description: 'Nội dung tin nhắn',
    example: 'Hello, how are you?',
  })
  @Prop({ required: true })
  content: string;

  @ApiProperty({
    description: 'Trạng thái tin nhắn',
    enum: MessageStatus,
    example: MessageStatus.Sent,
  })
  @Prop({
    type: String,
    enum: Object.values(MessageStatus),
    default: MessageStatus.Sent,
  })
  status: MessageStatus;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// Index để query messages theo chat và sort theo thời gian
MessageSchema.index({ chat_id: 1, createdAt: -1 });
