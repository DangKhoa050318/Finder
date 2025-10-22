import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { NotificationType } from '../models/notification.schema';
import { ApiProperty } from '@nestjs/swagger';

export class CreateNotificationDto {
  @ApiProperty({ description: 'User ID nhận notification' })
  @IsNotEmpty()
  @IsString()
  user_id: string;

  @ApiProperty({ enum: NotificationType, description: 'Loại notification' })
  @IsNotEmpty()
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ description: 'Tiêu đề notification' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ description: 'Mô tả (optional)', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Tin nhắn (optional)', required: false })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiProperty({ description: 'Avatar URL (optional)', required: false })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({
    description: 'ID của entity liên quan (optional)',
    required: false,
  })
  @IsOptional()
  @IsString()
  relatedId?: string;

  @ApiProperty({ description: 'Action URL (optional)', required: false })
  @IsOptional()
  @IsString()
  actionUrl?: string;

  @ApiProperty({
    description: 'Action button label (optional)',
    required: false,
  })
  @IsOptional()
  @IsString()
  actionLabel?: string;

  @ApiProperty({ description: 'Metadata bổ sung (optional)', required: false })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateNotificationDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class GetNotificationsDto {
  @ApiProperty({ required: false, enum: NotificationType })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiProperty({ required: false, type: Boolean })
  @IsOptional()
  @IsBoolean()
  unread_only?: boolean;

  @ApiProperty({ required: false, type: Number, default: 1 })
  @IsOptional()
  page?: number;

  @ApiProperty({ required: false, type: Number, default: 20 })
  @IsOptional()
  limit?: number;
}

export class MarkAsReadDto {
  @ApiProperty({ description: 'Array of notification IDs to mark as read' })
  @IsNotEmpty()
  notification_ids: string[];
}

export class DeleteNotificationDto {
  @ApiProperty({ description: 'Array of notification IDs to delete' })
  @IsNotEmpty()
  notification_ids: string[];
}

// Response DTOs
export class NotificationResponseDto {
  _id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  description?: string;
  message?: string;
  avatar?: string;
  relatedId?: string;
  actionUrl?: string;
  actionLabel?: string;
  isRead: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export class GetNotificationsResponseDto {
  data: NotificationResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  unreadCount: number;
}

export class MarkAsReadResponseDto {
  message: string;
  updated: number;
}
