import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import * as bcrypt from 'bcryptjs';
import { User } from 'src/decorators/user.decorator';
import type { JwtPayload } from 'src/types/jwt';
import {
  ChangePasswordDto,
  UpdateUserDto,
  UserResponseDto,
} from '../dtos/user.dto';
import { UserService } from '../services/user.service';
import { toDto } from '../utils/toDto';
import { Types } from 'mongoose';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('me')
  @ApiOperation({ summary: 'Lấy thông tin user hiện tại' })
  @ApiResponse({
    type: UserResponseDto,
  })
  async getMe(@User() { _id }: JwtPayload): Promise<UserResponseDto> {
    const user = await this.userService.findById(_id);
    if (!user) {
      throw new BadRequestException('Người dùng không tồn tại');
    }
    return toDto(user, UserResponseDto);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Cập nhật thông tin user hiện tại' })
  @ApiResponse({
    type: UserResponseDto,
  })
  async updateMe(
    @User() { _id }: JwtPayload,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const updateData = await this.prepareUpdateData(_id, updateUserDto);
    const user = await this.userService.updateUser(_id, updateData);

    if (!user) {
      throw new BadRequestException('Người dùng không tồn tại');
    }

    return toDto(user, UserResponseDto);
  }

  private async prepareUpdateData(
    userId: string,
    dto: UpdateUserDto,
  ): Promise<any> {
    const { timeSlots, days, major_id, ...rest } = dto;
    const updateData: any = { ...rest };

    // Convert major_id string to ObjectId
    if (major_id) {
      updateData.major_id = new Types.ObjectId(major_id);
    }

    // Handle schedule preference update
    if (timeSlots !== undefined || days !== undefined) {
      const currentSchedule = await this.getCurrentSchedule(userId);
      updateData.schedulePreference = {
        timeSlots: timeSlots ?? currentSchedule.timeSlots,
        days: days ?? currentSchedule.days,
      };
    }

    return updateData;
  }

  private async getCurrentSchedule(
    userId: string,
  ): Promise<{ timeSlots: any[]; days: any[] }> {
    const user = await this.userService.findById(userId);
    return (
      user?.schedulePreference || {
        timeSlots: [],
        days: [],
      }
    );
  }

  @Patch('me/password')
  @ApiOperation({ summary: 'Đổi mật khẩu' })
  async changePassword(
    @User() { _id }: JwtPayload,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    const user = await this.userService.findById(_id);

    if (!user) {
      throw new BadRequestException('Người dùng không tồn tại');
    }

    // Kiểm tra mật khẩu hiện tại
    const isMatch = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isMatch) {
      throw new BadRequestException('Mật khẩu hiện tại không đúng');
    }

    await this.userService.changePassword(_id, changePasswordDto.newPassword);

    return {
      message: 'Đổi mật khẩu thành công',
    };
  }
}
