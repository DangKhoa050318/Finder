import { Controller, Post, Body, Get, Request } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { LoginDto, RegisterDto } from '../dtos/auth.dto';
import { Public } from '../decorators/public.decorator';
import { User } from 'src/decorators/user.decorator';
import type { JwtPayload } from 'src/types/jwt';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Get('me')
  async getMe(@User() { email }: JwtPayload) {
    return this.authService.getMe(email);
  }
}
