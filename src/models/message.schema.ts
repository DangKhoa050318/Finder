import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';

export type MessageDocument = Message & Document;

export enum MessageStatus {
  Sent = 'sent',
  Delivered = 'delivered',
  Read = 'read',
}

export enum MessageType {
  TEXT = 'TEXT',
  SLOT_INVITATION = 'SLOT_INVITATION',
}

export interface Attachment {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
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
    description: 'Nội dung tin nhắn (có thể để trống nếu có attachments)',
    example: 'Hello, how are you?',
    required: false,
  })
  @Prop({ required: false, default: '' })
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

  @ApiProperty({
    description: 'Danh sách file đính kèm (ảnh, tài liệu)',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        filename: { type: 'string' },
        originalName: { type: 'string' },
        mimetype: { type: 'string' },
        size: { type: 'number' },
        url: { type: 'string' },
      },
    },
  })
  @Prop({
    type: [
      {
        filename: String,
        originalName: String,
        mimetype: String,
        size: Number,
        url: String,
      },
    ],
    default: [],
  })
  attachments: Attachment[];

  @ApiProperty({
    description: 'Loại tin nhắn',
    enum: MessageType,
    example: MessageType.TEXT,
  })
  @Prop({
    type: String,
    enum: Object.values(MessageType),
    default: MessageType.TEXT,
  })
  message_type: MessageType;

  @ApiProperty({
    description: 'Metadata bổ sung (cho các loại tin nhắn đặc biệt)',
    required: false,
  })
  @Prop({ type: Object, default: null })
  metadata: any;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// Index để query messages theo chat và sort theo thời gian
MessageSchema.index({ chat_id: 1, createdAt: -1 });
