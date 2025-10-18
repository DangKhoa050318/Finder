import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

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
  @ApiProperty({
    example: 'Computer Engineering Algorithms',
    description: 'Tên môn học',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  course_name?: string;
}
