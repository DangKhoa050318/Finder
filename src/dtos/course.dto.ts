import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCourseDto {
  @ApiProperty({
    example: 'CEA201',
    description: 'Mã môn học (course_id duy nhất)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(20)
  course_id: string;

  @ApiProperty({
    example: 'Computer Engineering Algorithms',
    description: 'Tên môn học',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  course_name: string;
}

export class UpdateCourseDto {
  @ApiPropertyOptional({
    example: 'Computer Engineering Algorithms',
    description: 'Tên môn học',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  @IsOptional()
  course_name?: string;
}

export class CourseResponseDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'ID môn học',
  })
  _id: string;

  @ApiProperty({
    example: 'CEA201',
    description: 'Mã môn học',
  })
  course_id: string;

  @ApiProperty({
    example: 'Computer Engineering Algorithms',
    description: 'Tên môn học',
  })
  course_name: string;

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

export class CourseListResponseDto {
  @ApiProperty({
    description: 'Danh sách các môn học',
    type: [CourseResponseDto],
  })
  @Type(() => CourseResponseDto)
  data: CourseResponseDto[];
}
