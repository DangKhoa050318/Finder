import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsMongoId,
  IsEnum,
} from 'class-validator';
import { ChatType } from '../models/chat.schema';

export class CreatePrivateChatDto {
  @ApiProperty({
    description: 'ID user thứ nhất',
    example: '507f1f77bcf86cd799439011',
  })
  @IsMongoId({ message: 'user1_id phải là ObjectId hợp lệ' })
  @IsNotEmpty({ message: 'user1_id không được để trống' })
  user1_id: string;

  @ApiProperty({
    description: 'ID user thứ hai',
    example: '507f1f77bcf86cd799439012',
  })
  @IsMongoId({ message: 'user2_id phải là ObjectId hợp lệ' })
  @IsNotEmpty({ message: 'user2_id không được để trống' })
  user2_id: string;
}

export class CreateGroupChatDto {
  @ApiProperty({
    description: 'ID nhóm',
    example: '507f1f77bcf86cd799439011',
  })
  @IsMongoId({ message: 'group_id phải là ObjectId hợp lệ' })
  @IsNotEmpty({ message: 'group_id không được để trống' })
  group_id: string;

  @ApiProperty({
    description: 'Danh sách ID members',
    type: [String],
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
  })
  @IsArray({ message: 'member_ids phải là array' })
  @IsMongoId({ each: true, message: 'Mỗi member_id phải là ObjectId hợp lệ' })
  @IsNotEmpty({ message: 'member_ids không được để trống' })
  member_ids: string[];
}

export class ChatResponseDto {
  @ApiProperty({
    description: 'ID chat',
    example: '507f1f77bcf86cd799439011',
  })
  _id: string;

  @ApiProperty({
    description: 'Loại chat',
    enum: ChatType,
    example: ChatType.Private,
  })
  chat_type: ChatType;

  @ApiProperty({
    description: 'ID nhóm (nếu là group chat)',
    example: '507f1f77bcf86cd799439011',
    nullable: true,
  })
  group_id: string | null;

  @ApiProperty({
    description: 'Ngày tạo',
    example: '2025-10-17T00:00:00.000Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Ngày cập nhật',
    example: '2025-10-17T00:00:00.000Z',
  })
  updated_at: Date;
}

export class GetUserChatsQueryDto {
  @ApiProperty({
    description: 'ID user',
    example: '507f1f77bcf86cd799439011',
  })
  @IsMongoId({ message: 'user_id phải là ObjectId hợp lệ' })
  @IsNotEmpty({ message: 'user_id không được để trống' })
  user_id: string;

  @ApiProperty({
    description: 'Loại chat',
    enum: ChatType,
    required: false,
  })
  @IsOptional()
  @IsEnum(ChatType, { message: 'chat_type phải là private hoặc group' })
  chat_type?: ChatType;
}
