import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { toDto } from 'src/utils/toDto';
import { RegisterDto } from '../dtos/auth.dto';
import { UserResponseDto } from '../dtos/user.dto';
import { UserService } from './user.service';
import { JwtPayload } from 'src/types/jwt';
import { EmailService } from './email.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Email không tồn tại');

    if (user.status.isBlocked) {
      throw new UnauthorizedException('Tài khoản đã bị khóa');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw new UnauthorizedException('Mật khẩu không đúng');
    return user;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    const payload: JwtPayload = {
      _id: user.id,
      email: user.email,
      role: user.role,
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: this.toUserDto(user),
    };
  }

  async register(data: RegisterDto) {
    console.log('\n🔵 [AUTH] Starting registration for:', data.email);
    const existed = await this.userService.findByEmail(data.email);
    if (existed) {
      console.log('🔴 [AUTH] Email already exists');
      throw new ConflictException('Email đã tồn tại');
    }
    console.log('🟢 [AUTH] Email is available, creating user...');
    try {
      const user = await this.userService.create(data);
      console.log('✅ [AUTH] User created successfully:', user._id);
      return {
        message: 'Đăng ký thành công',
      };
    } catch (error) {
      console.log('❌ [AUTH] Error during user creation:');
      console.log('Error name:', error.name);
      console.log('Error code:', error.code);
      console.log('Error message:', error.message);
      if (error.keyValue) console.log('Error keyValue:', error.keyValue);
      throw error;
    }
  }

  async getMe(email: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Người dùng không tồn tại');
    return this.toUserDto(user);
  }

  /**
   * Generate 6-digit OTP
   */
  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Send OTP to user's email for password reset
   */
  async forgotPassword(email: string) {
    console.log('\n🔵 [AUTH] Forgot password request for:', email);

    // Find user by email
    const user = await this.userService.findByEmail(email);
    if (!user) {
      console.log('🔴 [AUTH] Email not found');
      throw new BadRequestException('Email không tồn tại trong hệ thống');
    }

    // Check if account is blocked
    if (user.status.isBlocked) {
      console.log('🔴 [AUTH] Account is blocked');
      throw new BadRequestException('Tài khoản đã bị khóa');
    }

    // Generate OTP
    const otp = this.generateOtp();
    console.log('🔑 [AUTH] Generated OTP:', otp);

    // Set OTP expiry to 15 minutes from now
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 15);

    // Save OTP to user document
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    console.log('💾 [AUTH] OTP saved to database, expires at:', otpExpiry);

    // Send OTP via email
    try {
      await this.emailService.sendOtpEmail(email, otp, user.full_name);
      console.log('✅ [AUTH] OTP email sent successfully');
    } catch (error) {
      console.error('❌ [AUTH] Failed to send OTP email:', error);
      throw new BadRequestException(
        'Không thể gửi email. Vui lòng thử lại sau.',
      );
    }

    return {
      message: 'Mã OTP đã được gửi đến email của bạn',
    };
  }

  /**
   * Verify OTP
   */
  async verifyOtp(email: string, otp: string) {
    console.log('\n🔵 [AUTH] Verifying OTP for:', email);

    // Find user by email
    const user = await this.userService.findByEmail(email);
    if (!user) {
      console.log('🔴 [AUTH] Email not found');
      throw new BadRequestException('Email không tồn tại trong hệ thống');
    }

    // Check if OTP exists
    if (!user.otp || !user.otpExpiry) {
      console.log('🔴 [AUTH] No OTP found for user');
      throw new BadRequestException(
        'Không tìm thấy mã OTP. Vui lòng yêu cầu mã mới.',
      );
    }

    // Check if OTP has expired
    if (new Date() > user.otpExpiry) {
      console.log('🔴 [AUTH] OTP has expired');
      throw new BadRequestException(
        'Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.',
      );
    }

    // Verify OTP
    if (user.otp !== otp) {
      console.log('🔴 [AUTH] Invalid OTP');
      throw new BadRequestException('Mã OTP không đúng');
    }

    console.log('✅ [AUTH] OTP verified successfully');

    return {
      message: 'Mã OTP hợp lệ',
    };
  }

  /**
   * Reset password with OTP verification
   */
  async resetPassword(email: string, otp: string, newPassword: string) {
    console.log('\n🔵 [AUTH] Resetting password for:', email);

    // Find user by email
    const user = await this.userService.findByEmail(email);
    if (!user) {
      console.log('🔴 [AUTH] Email not found');
      throw new BadRequestException('Email không tồn tại trong hệ thống');
    }

    // Check if OTP exists
    if (!user.otp || !user.otpExpiry) {
      console.log('🔴 [AUTH] No OTP found for user');
      throw new BadRequestException(
        'Không tìm thấy mã OTP. Vui lòng yêu cầu mã mới.',
      );
    }

    // Check if OTP has expired
    if (new Date() > user.otpExpiry) {
      console.log('🔴 [AUTH] OTP has expired');
      throw new BadRequestException(
        'Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.',
      );
    }

    // Verify OTP
    if (user.otp !== otp) {
      console.log('🔴 [AUTH] Invalid OTP');
      throw new BadRequestException('Mã OTP không đúng');
    }

    console.log('✅ [AUTH] OTP verified, updating password...');

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;

    // Clear OTP fields
    user.otp = undefined;
    user.otpExpiry = undefined;

    await user.save();

    console.log('✅ [AUTH] Password reset successfully');

    // Send success notification email (don't wait for it)
    this.emailService
      .sendPasswordResetSuccessEmail(email, user.full_name)
      .catch((error) => {
        console.error('❌ [AUTH] Failed to send success email:', error);
      });

    return {
      message: 'Mật khẩu đã được đặt lại thành công',
    };
  }

  private toUserDto(user: any): UserResponseDto {
    return toDto(user, UserResponseDto);
  }
}
