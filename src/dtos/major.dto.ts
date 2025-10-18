import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMajorDto {
  @ApiProperty({
    example: 'se',
    description: 'Mã ngành (key duy nhất)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(10)
  key: string;

  @ApiProperty({
    example: 'Software Engineering',
    description: 'Tên ngành',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  name: string;
}

export class UpdateMajorDto {
  @ApiPropertyOptional({
    example: 'Software Engineering',
    description: 'Tên ngành',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  @IsOptional()
  name?: string;
}

export class MajorResponseDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'ID ngành',
  })
  _id: string;

  @ApiProperty({
    example: 'se',
    description: 'Mã ngành',
  })
  key: string;

  @ApiProperty({
    example: 'Software Engineering',
    description: 'Tên ngành',
  })
  name: string;

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

export class MajorListResponseDto {
  @ApiProperty({
    description: 'Danh sách các ngành',
    type: [MajorResponseDto],
  })
  @Type(() => MajorResponseDto)
  data: MajorResponseDto[];
}
