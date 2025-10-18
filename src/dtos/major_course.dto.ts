import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';
import { MajorResponseDto } from './major.dto';
import { CourseResponseDto } from './course.dto';

export class CreateMajorCourseDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'ID của ngành (Major ObjectId)',
  })
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  major_id: string;

  @ApiProperty({
    example: '507f1f77bcf86cd799439012',
    description: 'ID của môn học (Course ObjectId)',
  })
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  course_id: string;
}

export class GetCoursesByMajorDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'ID của ngành',
  })
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  major_id: string;
}

export class MajorCourseResponseDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'ID mối quan hệ',
  })
  _id: string;

  @ApiProperty({
    description: 'Thông tin ngành',
    type: () => MajorResponseDto,
  })
  @Type(() => MajorResponseDto)
  major_id: MajorResponseDto | string;

  @ApiProperty({
    description: 'Thông tin môn học',
    type: () => CourseResponseDto,
  })
  @Type(() => CourseResponseDto)
  course_id: CourseResponseDto | string;

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

export class MajorCourseListResponseDto {
  @ApiProperty({
    description: 'Danh sách mối quan hệ ngành-môn học',
    type: [MajorCourseResponseDto],
  })
  @Type(() => MajorCourseResponseDto)
  data: MajorCourseResponseDto[];
}
