import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  Max,
  Matches,
  IsMongoId,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserResponseDto } from './user.dto';

export class CreateAvailabilityDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'ID người dùng',
  })
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  user_id: string;

  @ApiProperty({
    example: 1,
    description: 'Ngày trong tuần (0 = Chủ nhật, 1 = Thứ 2, ..., 6 = Thứ 7)',
    minimum: 0,
    maximum: 6,
  })
  @IsInt()
  @Min(0)
  @Max(6)
  day_of_week: number;

  @ApiProperty({
    example: '08:00',
    description: 'Thời gian bắt đầu (HH:mm)',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'start_time phải có định dạng HH:mm',
  })
  start_time: string;

  @ApiProperty({
    example: '17:00',
    description: 'Thời gian kết thúc (HH:mm)',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'end_time phải có định dạng HH:mm',
  })
  end_time: string;
}

export class UpdateAvailabilityDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'Ngày trong tuần (0 = Chủ nhật, 1 = Thứ 2, ..., 6 = Thứ 7)',
    minimum: 0,
    maximum: 6,
  })
  @IsInt()
  @Min(0)
  @Max(6)
  @IsOptional()
  day_of_week?: number;

  @ApiPropertyOptional({
    example: '08:00',
    description: 'Thời gian bắt đầu (HH:mm)',
  })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'start_time phải có định dạng HH:mm',
  })
  @IsOptional()
  start_time?: string;

  @ApiPropertyOptional({
    example: '17:00',
    description: 'Thời gian kết thúc (HH:mm)',
  })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'end_time phải có định dạng HH:mm',
  })
  @IsOptional()
  end_time?: string;
}

export class AvailabilityResponseDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'ID khung giờ rảnh',
  })
  _id: string;

  @ApiProperty({
    description: 'Thông tin người dùng',
    type: () => UserResponseDto,
  })
  @Type(() => UserResponseDto)
  user_id: UserResponseDto | string;

  @ApiProperty({
    example: 1,
    description: 'Ngày trong tuần (0 = Chủ nhật, 1 = Thứ 2, ..., 6 = Thứ 7)',
  })
  day_of_week: number;

  @ApiProperty({
    example: '08:00',
    description: 'Thời gian bắt đầu',
  })
  start_time: string;

  @ApiProperty({
    example: '17:00',
    description: 'Thời gian kết thúc',
  })
  end_time: string;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Thời gian tạo',
  })
  @Type(() => Date)
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Thời gian cập nhật',
  })
  @Type(() => Date)
  updatedAt: Date;
}

export class AvailabilityListResponseDto {
  @ApiProperty({
    description: 'Danh sách khung giờ rảnh',
    type: [AvailabilityResponseDto],
  })
  @Type(() => AvailabilityResponseDto)
  data: AvailabilityResponseDto[];
}
