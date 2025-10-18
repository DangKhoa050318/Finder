import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { User } from '../decorators/user.decorator';
import type { JwtPayload } from '../types/jwt';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { BanService } from '../services/ban.service';
import { BanUserDto, UpdateBanDto } from '../dtos/ban.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Role } from '../models/user.schema';
import { BanStatus } from '../models/ban.schema';

@ApiTags('Bans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
@Controller('bans')
export class BanController {
  constructor(private readonly banService: BanService) {}

  @Post()
  @ApiOperation({ summary: 'Cấm một người dùng (Chỉ dành cho admin)' })
  @ApiResponse({ status: 201, description: 'Đã cấm người dùng thành công' })
  @ApiResponse({ status: 400, description: 'Người dùng đã bị cấm' })
  async banUser(@User() { _id }: JwtPayload, @Body() dto: BanUserDto) {
    const until = dto.until ? new Date(dto.until) : null;
    return this.banService.banUser(dto.user_id, _id, dto.reason, until);
  }

  @Put(':banId')
  @ApiOperation({ summary: 'Cập nhật lệnh cấm (Chỉ dành cho admin)' })
  @ApiParam({ name: 'banId', description: 'ID lệnh cấm' })
  @ApiResponse({ status: 200, description: 'Đã cập nhật lệnh cấm thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy lệnh cấm' })
  async updateBan(@Param('banId') banId: string, @Body() dto: UpdateBanDto) {
    const updates: any = { ...dto };
    if (dto.until) {
      updates.until = new Date(dto.until);
    }
    return this.banService.updateBan(banId, updates);
  }

  @Post(':banId/revoke')
  @ApiOperation({ summary: 'Hủy lệnh cấm (Chỉ dành cho admin)' })
  @ApiParam({ name: 'banId', description: 'ID lệnh cấm' })
  @ApiResponse({ status: 200, description: 'Đã hủy lệnh cấm thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy lệnh cấm' })
  async revokeBan(@Param('banId') banId: string) {
    return this.banService.revokeBan(banId);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy tất cả lệnh cấm (Chỉ dành cho admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: BanStatus })
  @ApiResponse({ status: 200, description: 'Danh sách lệnh cấm' })
  async getAllBans(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: BanStatus,
  ) {
    return this.banService.getAllBans(page, limit, status);
  }

  @Get('user/:userId/history')
  @ApiOperation({
    summary: 'Lấy lịch sử cấm của người dùng (Chỉ dành cho admin)',
  })
  @ApiParam({ name: 'userId', description: 'ID người dùng' })
  @ApiResponse({ status: 200, description: 'Lịch sử cấm' })
  async getUserBanHistory(@Param('userId') userId: string) {
    return this.banService.getUserBanHistory(userId);
  }

  @Get(':banId')
  @ApiOperation({ summary: 'Lấy lệnh cấm theo ID (Chỉ dành cho admin)' })
  @ApiParam({ name: 'banId', description: 'ID lệnh cấm' })
  @ApiResponse({ status: 200, description: 'Chi tiết lệnh cấm' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy lệnh cấm' })
  async getBanById(@Param('banId') banId: string) {
    return this.banService.getBanById(banId);
  }

  @Get('check/:userId')
  @ApiOperation({
    summary: 'Kiểm tra xem người dùng có bị cấm hay không (Chỉ dành cho admin)',
  })
  @ApiParam({ name: 'userId', description: 'ID người dùng' })
  @ApiResponse({ status: 200, description: 'Trả về true/false' })
  async isUserBanned(@Param('userId') userId: string) {
    const isBanned = await this.banService.isUserBanned(userId);
    return { isBanned };
  }

  @Post('expire-old')
  @ApiOperation({ summary: 'Hủy lệnh cấm cũ (Chỉ dành cho admin)' })
  @ApiResponse({ status: 200, description: 'Số lượng lệnh cấm đã hủy' })
  async expireOldBans() {
    return this.banService.expireOldBans();
  }
}
