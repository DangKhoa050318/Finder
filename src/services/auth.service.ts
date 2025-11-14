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
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PendingRegistration, PendingRegistrationDocument } from '../models/pending-registration.schema';
import { OAuth2Client } from 'google-auth-library';
import { ConfigService } from '../shared/config.service';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private configService: ConfigService,
    @InjectModel(PendingRegistration.name)
    private pendingRegistrationModel: Model<PendingRegistrationDocument>,
  ) {
    // Initialize Google OAuth client (client ID will be from frontend)
    this.googleClient = new OAuth2Client();
  }

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
    
    // Check if email already exists in User collection
    const existingUser = await this.userService.findByEmail(data.email);
    if (existingUser) {
      console.log('🔴 [AUTH] Email already registered');
      throw new ConflictException('Email đã được đăng ký');
    }

    // Check if email exists in PendingRegistration
    const existingPending = await this.pendingRegistrationModel.findOne({ email: data.email });
    
    // Generate OTP
    const otp = this.generateOtp();
    console.log('🔑 [AUTH] Generated OTP:', otp);

    // Set OTP expiry to 15 minutes from now
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 15);

    // Hash password before storing
    const hashedPassword = await bcrypt.hash(data.password, 10);

    try {
      if (existingPending) {
        // Update existing pending registration
        console.log('🔄 [AUTH] Updating existing pending registration');
        existingPending.full_name = data.full_name;
        existingPending.password = hashedPassword;
        existingPending.avatar = data.avatar;
        existingPending.otp = otp;
        existingPending.otpExpiry = otpExpiry;
        await existingPending.save();
      } else {
        // Create new pending registration
        console.log('✨ [AUTH] Creating new pending registration');
        await this.pendingRegistrationModel.create({
          full_name: data.full_name,
          email: data.email,
          password: hashedPassword,
          avatar: data.avatar,
          otp,
          otpExpiry,
          provider: 'local',
        });
      }

      console.log('💾 [AUTH] Pending registration saved, expires at:', otpExpiry);

      // Send OTP via email
      await this.emailService.sendRegistrationOtpEmail(data.email, otp, data.full_name);
      console.log('✅ [AUTH] Registration OTP email sent successfully');

      return {
        message: 'Mã OTP đã được gửi đến email của bạn. Vui lòng xác thực để hoàn tất đăng ký.',
      };
    } catch (error) {
      console.log('❌ [AUTH] Error during registration:');
      console.log('Error name:', error.name);
      console.log('Error message:', error.message);
      
      if (error.message?.includes('Không thể gửi email')) {
        throw error;
      }
      
      throw new BadRequestException('Đăng ký thất bại. Vui lòng thử lại sau.');
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
   * Verify registration OTP and create user
   */
  async verifyRegistrationOtp(email: string, otp: string) {
    console.log('\n🔵 [AUTH] Verifying registration OTP for:', email);

    // Find pending registration
    const pending = await this.pendingRegistrationModel.findOne({ email });
    if (!pending) {
      console.log('🔴 [AUTH] No pending registration found');
      throw new BadRequestException(
        'Không tìm thấy yêu cầu đăng ký. Vui lòng đăng ký lại.',
      );
    }

    // Check if OTP has expired
    if (new Date() > pending.otpExpiry) {
      console.log('🔴 [AUTH] OTP has expired');
      throw new BadRequestException(
        'Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.',
      );
    }

    // Verify OTP
    if (pending.otp !== otp) {
      console.log('🔴 [AUTH] Invalid OTP');
      throw new BadRequestException('Mã OTP không đúng');
    }

    console.log('✅ [AUTH] OTP verified, creating user...');

    try {
      // Create user with verified status
      const user = await this.userService.create({
        full_name: pending.full_name,
        email: pending.email,
        password: pending.password, // Already hashed
        avatar: pending.avatar,
      });

      // Update user to verified and set provider
      user.isVerified = true;
      user.provider = pending.provider;
      if (pending.googleId) {
        user.googleId = pending.googleId;
      }
      await user.save();

      // Delete pending registration
      await this.pendingRegistrationModel.deleteOne({ email });

      console.log('✅ [AUTH] User created and verified successfully:', user._id);

      return {
        message: 'Email đã được xác thực. Bạn có thể đăng nhập ngay!',
      };
    } catch (error) {
      console.log('❌ [AUTH] Error during user creation:', error);
      throw new BadRequestException('Không thể tạo tài khoản. Vui lòng thử lại.');
    }
  }

  /**
   * Resend registration OTP
   */
  async resendRegistrationOtp(email: string) {
    console.log('\n🔵 [AUTH] Resending registration OTP for:', email);

    // Find pending registration
    const pending = await this.pendingRegistrationModel.findOne({ email });
    if (!pending) {
      console.log('🔴 [AUTH] No pending registration found');
      throw new BadRequestException(
        'Không tìm thấy yêu cầu đăng ký. Vui lòng đăng ký lại.',
      );
    }

    // Generate new OTP
    const otp = this.generateOtp();
    console.log('🔑 [AUTH] Generated new OTP:', otp);

    // Set OTP expiry to 15 minutes from now
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 15);

    // Update pending registration
    pending.otp = otp;
    pending.otpExpiry = otpExpiry;
    await pending.save();

    console.log('💾 [AUTH] OTP updated, expires at:', otpExpiry);

    // Send OTP via email
    try {
      await this.emailService.sendRegistrationOtpEmail(email, otp, pending.full_name);
      console.log('✅ [AUTH] Registration OTP resent successfully');
    } catch (error) {
      console.error('❌ [AUTH] Failed to resend OTP email:', error);
      throw new BadRequestException(
        'Không thể gửi email. Vui lòng thử lại sau.',
      );
    }

    return {
      message: 'Mã OTP mới đã được gửi đến email của bạn',
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

  /**
   * Google OAuth authentication
   */
  async googleAuth(idToken: string) {
    console.log('\n🔵 [AUTH] Google OAuth authentication');

    try {
      let payload: any;
      
      // Check if this is a mock token (for development/testing)
      if (idToken.startsWith('eyJ') && idToken.length < 200) {
        try {
          // Try to decode as base64 mock token
          const decoded = Buffer.from(idToken, 'base64').toString('utf-8');
          payload = JSON.parse(decoded);
          console.log('🧪 [AUTH] Using mock Google token for testing');
        } catch (e) {
          // If not a valid mock token, proceed with real verification
          payload = null;
        }
      }
      
      // If not a mock token, verify with Google
      if (!payload) {
        const ticket = await this.googleClient.verifyIdToken({
          idToken,
          audience: undefined, // Will be verified by frontend's client ID
        });

        payload = ticket.getPayload();
        if (!payload) {
          throw new BadRequestException('Token Google không hợp lệ');
        }
      }

      const { sub: googleId, email, name, picture } = payload;

      if (!email) {
        throw new BadRequestException('Email không tồn tại trong tài khoản Google');
      }

      console.log('✅ [AUTH] Google token verified for:', email);

      // Check if user already exists
      let user = await this.userService.findByEmail(email);

      if (user) {
        // Existing user - log them in
        console.log('✅ [AUTH] Existing user found, logging in');

        // Update Google ID if not set
        if (!user.googleId) {
          user.googleId = googleId;
          user.provider = 'google';
          await user.save();
        }

        const jwtPayload: JwtPayload = {
          _id: user.id,
          email: user.email,
          role: user.role,
        };

        return {
          message: 'Đăng nhập thành công',
          access_token: this.jwtService.sign(jwtPayload),
          user: this.toUserDto(user),
          requiresOtpVerification: false,
        };
      }

      // New user - create pending registration and send OTP
      console.log('🆕 [AUTH] New Google user, creating pending registration');

      // Check if pending registration exists
      const existingPending = await this.pendingRegistrationModel.findOne({ email });

      // Generate OTP
      const otp = this.generateOtp();
      console.log('🔑 [AUTH] Generated OTP:', otp);

      // Set OTP expiry to 15 minutes from now
      const otpExpiry = new Date();
      otpExpiry.setMinutes(otpExpiry.getMinutes() + 15);

      // Generate temporary password (will be replaced when user sets their own)
      const tempPassword = await bcrypt.hash(Math.random().toString(36), 10);

      if (existingPending) {
        // Update existing pending registration
        existingPending.full_name = name || email.split('@')[0];
        existingPending.password = tempPassword;
        existingPending.avatar = picture;
        existingPending.googleId = googleId;
        existingPending.provider = 'google';
        existingPending.otp = otp;
        existingPending.otpExpiry = otpExpiry;
        await existingPending.save();
      } else {
        // Create new pending registration
        await this.pendingRegistrationModel.create({
          full_name: name || email.split('@')[0],
          email,
          password: tempPassword,
          avatar: picture,
          googleId,
          provider: 'google',
          otp,
          otpExpiry,
        });
      }

      console.log('💾 [AUTH] Pending registration saved');

      // Send OTP via email
      await this.emailService.sendRegistrationOtpEmail(
        email,
        otp,
        name || email.split('@')[0],
      );
      console.log('✅ [AUTH] Registration OTP email sent');

      return {
        message: 'Mã OTP đã được gửi đến email của bạn. Vui lòng xác thực để hoàn tất đăng ký.',
        email,
        requiresOtpVerification: true,
      };
    } catch (error) {
      console.error('❌ [AUTH] Google OAuth error:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Xác thực Google thất bại. Vui lòng thử lại.');
    }
  }

  /**
   * Set password after Google OAuth registration and OTP verification
   */
  async setPasswordAfterGoogle(email: string, password: string) {
    console.log('\n🔵 [AUTH] Setting password after Google OAuth for:', email);

    // Find user
    const user = await this.userService.findByEmail(email);
    if (!user) {
      console.log('🔴 [AUTH] User not found');
      throw new BadRequestException('Người dùng không tồn tại');
    }

    // Check if user is verified
    if (!user.isVerified) {
      console.log('🔴 [AUTH] User not verified');
      throw new BadRequestException('Email chưa được xác thực');
    }

    // Check if user registered via Google
    if (user.provider !== 'google') {
      console.log('🔴 [AUTH] User did not register via Google');
      throw new BadRequestException('Chức năng này chỉ dành cho tài khoản Google');
    }

    console.log('✅ [AUTH] Updating password...');

    // Update password (will be hashed by pre-save hook)
    user.password = password;
    await user.save();

    console.log('✅ [AUTH] Password set successfully');

    // Generate JWT token
    const jwtPayload: JwtPayload = {
      _id: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      message: 'Đặt mật khẩu thành công',
      access_token: this.jwtService.sign(jwtPayload),
      user: this.toUserDto(user),
    };
  }

  private toUserDto(user: any): UserResponseDto {
    return toDto(user, UserResponseDto);
  }
}
