import { Controller, Post, Body, Get, Request } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import {
  LoginDto,
  RegisterDto,
  AuthLoginResponseDto,
  RegisterResponseDto,
  ForgotPasswordDto,
  ForgotPasswordResponseDto,
  VerifyOtpDto,
  VerifyOtpResponseDto,
  ResetPasswordDto,
  ResetPasswordResponseDto,
  VerifyRegistrationOtpDto,
  VerifyRegistrationOtpResponseDto,
  ResendRegistrationOtpDto,
  ResendRegistrationOtpResponseDto,
  GoogleAuthDto,
  GoogleAuthResponseDto,
  SetPasswordAfterGoogleDto,
  SetPasswordAfterGoogleResponseDto,
} from '../dtos/auth.dto';
import { UserResponseDto } from '../dtos/user.dto';
import { Public } from '../decorators/public.decorator';
import { User } from 'src/decorators/user.decorator';
import type { JwtPayload } from 'src/types/jwt';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    @InjectConnection() private connection: Connection,
  ) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Đăng nhập' })
  @ApiResponse({
    status: 200,
    description: 'Đăng nhập thành công',
    type: AuthLoginResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Email hoặc mật khẩu không đúng' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Đăng ký tài khoản' })
  @ApiResponse({
    status: 201,
    description: 'OTP đã được gửi đến email',
    type: RegisterResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Email đã được đăng ký' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('verify-registration-otp')
  @ApiOperation({ summary: 'Xác thực OTP đăng ký và tạo tài khoản' })
  @ApiResponse({
    status: 200,
    description: 'Email đã được xác thực',
    type: VerifyRegistrationOtpResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Mã OTP không hợp lệ hoặc đã hết hạn',
  })
  async verifyRegistrationOtp(@Body() verifyDto: VerifyRegistrationOtpDto) {
    return this.authService.verifyRegistrationOtp(verifyDto.email, verifyDto.otp);
  }

  @Public()
  @Post('resend-registration-otp')
  @ApiOperation({ summary: 'Gửi lại mã OTP đăng ký' })
  @ApiResponse({
    status: 200,
    description: 'Mã OTP mới đã được gửi',
    type: ResendRegistrationOtpResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Không tìm thấy yêu cầu đăng ký',
  })
  async resendRegistrationOtp(@Body() resendDto: ResendRegistrationOtpDto) {
    return this.authService.resendRegistrationOtp(resendDto.email);
  }

  @Public()
  @Post('google')
  @ApiOperation({ summary: 'Đăng nhập/Đăng ký bằng Google' })
  @ApiResponse({
    status: 200,
    description: 'Xác thực Google thành công',
    type: GoogleAuthResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Token Google không hợp lệ',
  })
  async googleAuth(@Body() googleAuthDto: GoogleAuthDto) {
    return this.authService.googleAuth(googleAuthDto.idToken);
  }

  @Public()
  @Post('set-password-after-google')
  @ApiOperation({ summary: 'Đặt mật khẩu sau khi đăng ký bằng Google' })
  @ApiResponse({
    status: 200,
    description: 'Đặt mật khẩu thành công',
    type: SetPasswordAfterGoogleResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Email chưa được xác thực hoặc không hợp lệ',
  })
  async setPasswordAfterGoogle(@Body() setPasswordDto: SetPasswordAfterGoogleDto) {
    return this.authService.setPasswordAfterGoogle(
      setPasswordDto.email,
      setPasswordDto.password,
    );
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thông tin người dùng hiện tại' })
  @ApiResponse({
    status: 200,
    description: 'Thông tin người dùng',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  async getMe(@User() { email }: JwtPayload) {
    return this.authService.getMe(email);
  }

  @Public()
  @Post('forgot-password')
  @ApiOperation({ summary: 'Gửi mã OTP để đặt lại mật khẩu' })
  @ApiResponse({
    status: 200,
    description: 'Mã OTP đã được gửi đến email',
    type: ForgotPasswordResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Email không tồn tại hoặc tài khoản bị khóa',
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Public()
  @Post('verify-otp')
  @ApiOperation({ summary: 'Xác thực mã OTP' })
  @ApiResponse({
    status: 200,
    description: 'Mã OTP hợp lệ',
    type: VerifyOtpResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Mã OTP không hợp lệ hoặc đã hết hạn',
  })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto.email, verifyOtpDto.otp);
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({ summary: 'Đặt lại mật khẩu với mã OTP' })
  @ApiResponse({
    status: 200,
    description: 'Mật khẩu đã được đặt lại thành công',
    type: ResetPasswordResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Mã OTP không hợp lệ hoặc đã hết hạn',
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(
      resetPasswordDto.email,
      resetPasswordDto.otp,
      resetPasswordDto.newPassword,
    );
  }
}
