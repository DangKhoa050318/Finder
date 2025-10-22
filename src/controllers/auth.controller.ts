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
    description: 'Đăng ký thành công',
    type: RegisterResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Email đã tồn tại' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
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
  @Post('fix-index')
  @ApiOperation({ summary: 'Fix ChatParticipant index - TEMPORARY ENDPOINT' })
  async fixIndex() {
    try {
      const collection = this.connection.collection('chatparticipants');
      
      // Drop old index
      try {
        await collection.dropIndex('user_id_1');
        console.log('Dropped old user_id_1 index');
      } catch (err) {
        console.log('Index user_id_1 không tồn tại hoặc đã drop');
      }
      
      // Create new sparse index
      await collection.createIndex({ user_id: 1 }, { sparse: true });
      console.log('Created new sparse index on user_id');
      
      return { message: 'Index đã được sửa thành công' };
    } catch (error) {
      console.error('Error fixing index:', error);
      return { error: error.message };
    }
  }
}
