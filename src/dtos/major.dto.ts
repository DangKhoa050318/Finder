import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

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
  @ApiProperty({
    example: 'Software Engineering',
    description: 'Tên ngành',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  name?: string;
}
