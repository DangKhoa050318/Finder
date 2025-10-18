import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsMongoId } from 'class-validator';

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
