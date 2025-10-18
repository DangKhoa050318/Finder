import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  Max,
  Matches,
  IsMongoId,
} from 'class-validator';

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
  @ApiProperty({
    example: 1,
    description: 'Ngày trong tuần (0 = Chủ nhật, 1 = Thứ 2, ..., 6 = Thứ 7)',
    minimum: 0,
    maximum: 6,
    required: false,
  })
  @IsInt()
  @Min(0)
  @Max(6)
  day_of_week?: number;

  @ApiProperty({
    example: '08:00',
    description: 'Thời gian bắt đầu (HH:mm)',
    required: false,
  })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'start_time phải có định dạng HH:mm',
  })
  start_time?: string;

  @ApiProperty({
    example: '17:00',
    description: 'Thời gian kết thúc (HH:mm)',
    required: false,
  })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'end_time phải có định dạng HH:mm',
  })
  end_time?: string;
}
