import {
  ApiProperty,
  ApiPropertyOptional,
  PartialType,
  PickType,
} from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
} from 'class-validator';
import { Day, TimeSlot, User } from '../models/user.schema';

export class UserResponseDto extends User {
  @Exclude()
  declare password: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'Họ và tên đầy đủ của người dùng',
    example: 'Nguyễn Văn A',
  })
  @IsString({ message: 'Họ và tên phải là chuỗi ký tự' })
  @MinLength(5, { message: 'Họ và tên phải có ít nhất 5 ký tự' })
  @IsOptional()
  full_name?: string;

  @ApiPropertyOptional({
    description: 'ID của ngành học',
    example: '6523f1c9e7a1b2d3c4e5f6a7',
  })
  @IsMongoId({ message: 'major_id phải là ObjectId hợp lệ' })
  @IsOptional()
  major_id?: string;

  @ApiPropertyOptional({
    description: 'URL avatar của người dùng',
    example: 'https://example.com/avatar.jpg',
  })
  @IsString({ message: 'Avatar phải là chuỗi ký tự' })
  @IsOptional()
  avatar?: string;

  @ApiPropertyOptional({
    description: 'Các khung giờ học mong muốn',
    enum: TimeSlot,
    isArray: true,
    example: ['morning', 'afternoon'],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(TimeSlot, { each: true, message: 'Khung giờ không hợp lệ' })
  timeSlots?: TimeSlot[];

  @ApiPropertyOptional({
    description: 'Các ngày trong tuần mong muốn',
    enum: Day,
    isArray: true,
    example: ['monday', 'wednesday', 'friday'],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(Day, { each: true, message: 'Ngày không hợp lệ' })
  days?: Day[];
}

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Mật khẩu hiện tại',
    example: 'oldPassword123',
  })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({
    description: 'Mật khẩu mới',
    example: 'newPassword123',
  })
  @IsString()
  @MinLength(8, { message: 'Mật khẩu mới phải có ít nhất 8 ký tự' })
  newPassword: string;
}
