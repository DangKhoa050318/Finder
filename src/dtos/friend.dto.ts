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
  @ApiPropertyOptional({ enum: FriendRequestStatus, description: 'Lọc theo trạng thái' })
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
