import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  MinLength,
} from 'class-validator';
import { UserResponseDto } from './user.dto';

export class LoginDto {
  @ApiProperty({
    description: 'Email của người dùng',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Mật khẩu của người dùng',
    example: 'password123',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class RegisterDto {
  @ApiProperty({
    description: 'Họ và tên đầy đủ của người dùng',
    example: 'Nguyễn Văn A',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5, { message: 'Họ và tên phải có ít nhất 5 ký tự' })
  full_name: string;

  @ApiProperty({
    description: 'Email của người dùng',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @ApiProperty({
    description: 'Mật khẩu của người dùng',
    example: 'password123',
  })
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
  password: string;

  @ApiPropertyOptional({
    description: 'URL avatar của người dùng',
    example: 'https://example.com/avatar.jpg',
  })
  @IsString({ message: 'Avatar phải là chuỗi ký tự' })
  @IsOptional()
  avatar?: string;
}

export class AuthLoginResponseDto {
  @ApiProperty({ description: 'JWT access token' })
  access_token: string;

  @ApiProperty({ description: 'Thông tin người dùng', type: UserResponseDto })
  user: UserResponseDto;
}

export class RegisterResponseDto {
  @ApiProperty({ description: 'Thông báo', example: 'Đăng ký thành công' })
  message: string;
}
