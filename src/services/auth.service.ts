import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
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
    const isMatch = await bcrypt.compare(password, user.password);
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
    const existed = await this.userService.findByEmail(data.email);
    if (existed) throw new BadRequestException('Email đã tồn tại');
    await this.userService.create(data);
    return {
      message: 'Đăng ký thành công',
    };
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
