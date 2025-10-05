import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UserService } from './user.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { Types } from 'mongoose';

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
    const payload = { sub: user._id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  async register(data: { email: string, full_name: string, password: string, major_id: string }) {
    const existed = await this.userService.findByEmail(data.email);
    if (existed) throw new BadRequestException('Email đã tồn tại');
    const hash = await bcrypt.hash(data.password, 10);
    return this.userService.create({
      user_id: data.email,
      email: data.email,
      full_name: data.full_name,
      password: hash,
      major_id: new Types.ObjectId(data.major_id), // chuyển sang ObjectId
      role: 'User',
    });
  }
}