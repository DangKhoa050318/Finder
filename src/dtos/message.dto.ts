import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsMongoId,
  IsEnum,
  MaxLength,
  ValidateNested,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MessageStatus, MessageType } from '../models/message.schema';

export class AttachmentDto {
  @ApiProperty({ description: 'Tên file trên server' })
  @IsString()
  filename: string;

  @ApiProperty({ description: 'Tên file gốc' })
  @IsString()
  originalName: string;

  @ApiProperty({ description: 'MIME type' })
  @IsString()
  mimetype: string;

  @ApiProperty({ description: 'Kích thước file (bytes)' })
  size: number;

  @ApiProperty({ description: 'URL truy cập file' })
  @IsString()
  url: string;
}

export class SendMessageDto {
  @ApiProperty({
    description: 'ID chat',
    example: '507f1f77bcf86cd799439011',
  })
  @IsMongoId({ message: 'chat_id phải là ObjectId hợp lệ' })
  @IsNotEmpty({ message: 'chat_id không được để trống' })
  chat_id: string;

  @ApiProperty({
    description: 'ID người gửi',
    example: '507f1f77bcf86cd799439012',
  })
  @IsMongoId({ message: 'sender_id phải là ObjectId hợp lệ' })
  @IsNotEmpty({ message: 'sender_id không được để trống' })
  sender_id: string;

  @ApiProperty({
    description: 'Nội dung tin nhắn (có thể để trống nếu có attachments)',
    example: 'Hello, how are you?',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'content phải là chuỗi' })
  @MaxLength(5000, { message: 'content không được vượt quá 5000 ký tự' })
  content?: string;

  @ApiProperty({
    description: 'Danh sách file đính kèm',
    type: [AttachmentDto],
    required: false,
  })
  @IsOptional()
  @IsArray({ message: 'attachments phải là array' })
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];

  @ApiProperty({
    description: 'Loại tin nhắn',
    enum: MessageType,
    example: MessageType.TEXT,
    required: false,
  })
  @IsOptional()
  @IsEnum(MessageType, { message: 'message_type không hợp lệ' })
  message_type?: MessageType;

  @ApiProperty({
    description: 'Metadata bổ sung (cho slot invitation, etc)',
    required: false,
  })
  @IsOptional()
  metadata?: any;
}

export class GetMessagesQueryDto {
  @ApiProperty({
    description: 'ID chat',
    example: '507f1f77bcf86cd799439011',
  })
  @IsMongoId({ message: 'chat_id phải là ObjectId hợp lệ' })
  @IsNotEmpty({ message: 'chat_id không được để trống' })
  chat_id: string;

  @ApiProperty({
    description: 'Số lượng messages muốn lấy',
    example: 50,
    required: false,
    default: 50,
  })
  @IsOptional()
  limit?: number;

  @ApiProperty({
    description:
      'ID message để lấy những messages cũ hơn (cursor-based pagination)',
    example: '507f1f77bcf86cd799439011',
    required: false,
  })
  @IsOptional()
  @IsMongoId({ message: 'before_id phải là ObjectId hợp lệ' })
  before_id?: string;
}

export class MarkAsSeenDto {
  @ApiProperty({
    description: 'ID message',
    example: '507f1f77bcf86cd799439011',
  })
  @IsMongoId({ message: 'message_id phải là ObjectId hợp lệ' })
  @IsNotEmpty({ message: 'message_id không được để trống' })
  message_id: string;

  @ApiProperty({
    description: 'ID user đã seen',
    example: '507f1f77bcf86cd799439012',
  })
  @IsMongoId({ message: 'user_id phải là ObjectId hợp lệ' })
  @IsNotEmpty({ message: 'user_id không được để trống' })
  user_id: string;
}

export class MessageResponseDto {
  @ApiProperty({
    description: 'ID message',
    example: '507f1f77bcf86cd799439011',
  })
  _id: string;

  @ApiProperty({
    description: 'ID chat',
    example: '507f1f77bcf86cd799439012',
  })
  chat_id: string;

  @ApiProperty({
    description: 'ID người gửi',
    example: '507f1f77bcf86cd799439013',
  })
  sender_id: string;

  @ApiProperty({
    description: 'Nội dung tin nhắn',
    example: 'Hello!',
  })
  content: string;

  @ApiProperty({
    description: 'Ngày tạo',
    example: '2025-10-17T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Trạng thái',
    enum: MessageStatus,
    example: MessageStatus.Sent,
  })
  status: MessageStatus;
}
