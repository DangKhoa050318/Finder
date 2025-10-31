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

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Email của người dùng',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;
}

export class VerifyOtpDto {
  @ApiProperty({
    description: 'Email của người dùng',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @ApiProperty({
    description: 'Mã OTP 6 chữ số',
    example: '123456',
  })
  @IsString({ message: 'OTP phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'OTP không được để trống' })
  @Length(6, 6, { message: 'OTP phải có đúng 6 ký tự' })
  otp: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Email của người dùng',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @ApiProperty({
    description: 'Mã OTP 6 chữ số',
    example: '123456',
  })
  @IsString({ message: 'OTP phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'OTP không được để trống' })
  @Length(6, 6, { message: 'OTP phải có đúng 6 ký tự' })
  otp: string;

  @ApiProperty({
    description: 'Mật khẩu mới',
    example: 'newPassword123',
  })
  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
  newPassword: string;
}

export class ForgotPasswordResponseDto {
  @ApiProperty({
    description: 'Thông báo',
    example: 'Mã OTP đã được gửi đến email của bạn',
  })
  message: string;
}

export class VerifyOtpResponseDto {
  @ApiProperty({
    description: 'Thông báo',
    example: 'Mã OTP hợp lệ',
  })
  message: string;
}

export class ResetPasswordResponseDto {
  @ApiProperty({
    description: 'Thông báo',
    example: 'Mật khẩu đã được đặt lại thành công',
  })
  message: string;
}
