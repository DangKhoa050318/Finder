import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsMongoId,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { MessageStatus } from '../models/message.schema';

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
    description: 'Nội dung tin nhắn',
    example: 'Hello, how are you?',
  })
  @IsString({ message: 'content phải là chuỗi' })
  @IsNotEmpty({ message: 'content không được để trống' })
  @MaxLength(5000, { message: 'content không được vượt quá 5000 ký tự' })
  content: string;

  @ApiProperty({
    description: 'Danh sách file đính kèm (URLs)',
    type: [String],
    required: false,
    example: ['https://example.com/file1.pdf', 'https://example.com/image1.jpg'],
  })
  @IsOptional()
  @IsArray({ message: 'attachments phải là array' })
  @IsString({ each: true, message: 'Mỗi attachment phải là string URL' })
  attachments?: string[];
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
    description: 'Số lượng messages',
    example: 50,
    required: false,
    default: 50,
  })
  @IsOptional()
  limit?: number;

  @ApiProperty({
    description: 'Bỏ qua n messages đầu tiên',
    example: 0,
    required: false,
    default: 0,
  })
  @IsOptional()
  skip?: number;
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
  created_at: Date;

  @ApiProperty({
    description: 'Trạng thái',
    enum: MessageStatus,
    example: MessageStatus.Sent,
  })
  status: MessageStatus;
}
