import { IsNotEmpty, IsOptional, IsEnum, IsMongoId } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FriendRequestStatus } from '../models/friend-request.schema';

export class SendFriendRequestDto {
  @ApiProperty({ description: 'ID của người nhận lời mời kết bạn' })
  @IsNotEmpty({ message: 'Requestee ID không được để trống' })
  @IsMongoId({ message: 'Requestee ID không hợp lệ' })
  requestee_id: string;
}

export class UpdateFriendRequestDto {
  @ApiProperty({ enum: FriendRequestStatus, description: 'Trạng thái mới' })
  @IsNotEmpty({ message: 'Status không được để trống' })
  @IsEnum(FriendRequestStatus, { message: 'Status không hợp lệ' })
  status: FriendRequestStatus;
}

export class GetFriendRequestsDto {
  @ApiPropertyOptional({
    enum: FriendRequestStatus,
    description: 'Lọc theo trạng thái',
  })
  @IsOptional()
  @IsEnum(FriendRequestStatus, { message: 'Status không hợp lệ' })
  status?: FriendRequestStatus;

  @ApiPropertyOptional({ description: 'Số trang', default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Số lượng mỗi trang', default: 20 })
  @IsOptional()
  limit?: number;
}

export class SuggestedFriendDto {
  @ApiProperty({ description: 'ID người dùng' })
  _id: string;

  @ApiProperty({ description: 'Họ và tên' })
  full_name: string;

  @ApiProperty({ description: 'Email' })
  email: string;

  @ApiProperty({ description: 'Avatar URL', nullable: true })
  avatar: string | null;

  @ApiProperty({ description: 'Ngành học', required: false })
  major_id?: {
    _id: string;
    name: string;
  };

  @ApiProperty({ description: 'Điểm phù hợp (cao hơn = phù hợp hơn)' })
  matchScore: number;

  @ApiProperty({
    description: 'Lý do gợi ý',
    type: 'object',
    properties: {
      sameMajor: { type: 'boolean', description: 'Cùng ngành học' },
      availabilityOverlap: {
        type: 'number',
        description: 'Số lượng khung giờ rảnh trùng nhau',
      },
    },
  })
  matchReasons: {
    sameMajor: boolean;
    availabilityOverlap: number;
  };
}

export class FriendRequestResponseDto {
  @ApiProperty({ description: 'ID lời mời kết bạn' })
  _id: string;

  @ApiProperty({ description: 'Người gửi lời mời' })
  requester_id: {
    _id: string;
    full_name: string;
    email: string;
    avatar: string | null;
  };

  @ApiProperty({ description: 'Người nhận lời mời' })
  requestee_id: {
    _id: string;
    full_name: string;
    email: string;
    avatar: string | null;
  };

  @ApiProperty({ enum: FriendRequestStatus, description: 'Trạng thái' })
  status: FriendRequestStatus;

  @ApiProperty({ description: 'Ngày tạo' })
  date: Date;
}

export class FriendResponseDto {
  @ApiProperty({ description: 'ID người bạn' })
  _id: string;

  @ApiProperty({ description: 'Họ và tên' })
  full_name: string;

  @ApiProperty({ description: 'Email' })
  email: string;

  @ApiProperty({ description: 'Avatar URL', nullable: true })
  avatar: string | null;

  @ApiProperty({ description: 'Ngành học', required: false })
  major_id?: {
    _id: string;
    name: string;
  };
}

export class FriendshipStatusDto {
  @ApiProperty({ description: 'Có phải bạn bè không' })
  areFriends: boolean;
}

export class MessageResponseDto {
  @ApiProperty({ description: 'Thông báo' })
  message: string;
}
