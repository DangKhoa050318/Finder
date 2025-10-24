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

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
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

  private toUserDto(user: any): UserResponseDto {
    return toDto(user, UserResponseDto);
  }
}
