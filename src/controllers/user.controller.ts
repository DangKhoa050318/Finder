import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Request,
  Param,
  NotFoundException,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import * as bcrypt from 'bcryptjs';
import { User } from 'src/decorators/user.decorator';
import type { JwtPayload } from 'src/types/jwt';
import {
  ChangePasswordDto,
  UpdateUserDto,
  UserResponseDto,
  SearchUsersDto,
  UserSearchResultDto,
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
  @ApiResponse({ status: 404, description: 'Người dùng không tồn tại' })
  async getMe(@User() { _id }: JwtPayload): Promise<UserResponseDto> {
    const user = await this.userService.findByIdWithPopulate(_id);
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }
    return toDto(user, UserResponseDto);
  }

  @Get('search')
  @ApiOperation({ summary: 'Tìm kiếm người dùng theo tên, email, và filters' })
  @ApiQuery({
    name: 'query',
    required: false,
    description: 'Tìm kiếm theo tên hoặc email',
  })
  @ApiQuery({
    name: 'isBlocked',
    required: false,
    type: Boolean,
    description: 'Lọc người dùng bị chặn',
  })
  @ApiQuery({
    name: 'major_id',
    required: false,
    description: 'Lọc theo ngành học',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Số lượng kết quả tối đa',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Số trang',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách người dùng tìm được',
    schema: {
      type: 'object',
      properties: {
        users: {
          type: 'array',
          items: { $ref: '#/components/schemas/UserSearchResultDto' },
        },
        pagination: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            page: { type: 'number' },
            limit: { type: 'number' },
            totalPages: { type: 'number' },
          },
        },
      },
    },
  })
  async searchUsers(@Query() searchDto: SearchUsersDto) {
    return this.userService.searchUsers({
      query: searchDto.query,
      isBlocked: searchDto.isBlocked,
      major_id: searchDto.major_id,
      limit: searchDto.limit,
      page: searchDto.page,
    });
  }

  // Support legacy endpoint for direct user ID access
  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin user theo ID' })
  @ApiResponse({
    status: 200,
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Người dùng không tồn tại' })
  async getById(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.userService.findByIdWithPopulate(id);
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }
    return toDto(user, UserResponseDto);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Cập nhật thông tin user hiện tại' })
  @ApiResponse({
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Người dùng không tồn tại' })
  async updateMe(
    @User() { _id }: JwtPayload,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const updateData = await this.prepareUpdateData(_id, updateUserDto);
    const user = await this.userService.updateUser(_id, updateData);

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }
    await user.populate('major_id');

    return toDto(user, UserResponseDto);
  }

  // Support legacy endpoint for direct user ID update
  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin user theo ID' })
  @ApiResponse({
    status: 200,
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Người dùng không tồn tại' })
  async updateById(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const updateData = await this.prepareUpdateData(id, updateUserDto);
    const user = await this.userService.updateUser(id, updateData);

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
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
  @ApiResponse({ status: 200, description: 'Đổi mật khẩu thành công' })
  @ApiResponse({
    status: 400,
    description: 'Mật khẩu hiện tại không đúng',
  })
  @ApiResponse({
    status: 404,
    description: 'Người dùng không tồn tại',
  })
  async changePassword(
    @User() { _id }: JwtPayload,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    const user = await this.userService.findById(_id);

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
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
