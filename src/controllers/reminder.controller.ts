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
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ReminderService } from '../services/reminder.service';
import { CreateReminderDto, UpdateReminderDto } from '../dtos/reminder.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ReminderStatus } from '../models/reminder.schema';

@ApiTags('Reminders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reminders')
export class ReminderController {
  constructor(private readonly reminderService: ReminderService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo reminder' })
  @ApiResponse({ status: 201, description: 'Reminder được tạo thành công' })
  @ApiResponse({ status: 400, description: 'Yêu cầu không hợp lệ (thời gian trong quá khứ hoặc trùng lặp)' })
  async createReminder(
    @Request() req,
    @Body() dto: CreateReminderDto,
  ) {
    const remindAt = new Date(dto.remind_at);

    return this.reminderService.createReminder(
      dto.slot_id,
      req.user.id,
      remindAt,
      dto.method,
      dto.message,
    );
  }

  @Put(':reminderId')
  @ApiOperation({ summary: 'Cập nhật Reminder' })
  @ApiParam({ name: 'reminderId', description: 'ID reminder' })
  @ApiResponse({ status: 200, description: 'Reminder được cập nhật thành công' })
  @ApiResponse({ status: 400, description: 'Không thể cập nhật reminder đã gửi/thất bại' })
  @ApiResponse({ status: 403, description: 'Không phải reminder của bạn' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy reminder' })
  async updateReminder(
    @Request() req,
    @Param('reminderId') reminderId: string,
    @Body() dto: UpdateReminderDto,
  ) {
    const updates: any = { ...dto };
    if (dto.remind_at) {
      updates.remind_at = new Date(dto.remind_at);
    }

    return this.reminderService.updateReminder(reminderId, req.user.id, updates);
  }

  @Delete(':reminderId')
  @ApiOperation({ summary: 'Xóa reminder' })
  @ApiParam({ name: 'reminderId', description: 'ID reminder' })
  @ApiResponse({ status: 200, description: 'Reminder được xóa thành công' })
  @ApiResponse({ status: 400, description: 'Không thể xóa reminder đã gửi/thất bại' })
  @ApiResponse({ status: 403, description: 'Không phải reminder của bạn' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy reminder' })
  async deleteReminder(
    @Request() req,
    @Param('reminderId') reminderId: string,
  ) {
    return this.reminderService.deleteReminder(reminderId, req.user.id);
  }

  @Get('my-reminders')
  @ApiOperation({ summary: 'Lấy reminder của người dùng' })
  @ApiQuery({ name: 'status', required: false, enum: ReminderStatus })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Danh sách reminder của người dùng' })
  async getUserReminders(
    @Request() req,
    @Query('status') status?: ReminderStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.reminderService.getUserReminders(
      req.user.id,
      status,
      page,
      limit,
    );
  }

  @Get('slot/:slotId')
  @ApiOperation({ summary: 'Lấy reminder theo slot' })
  @ApiParam({ name: 'slotId', description: 'ID slot' })
  @ApiResponse({ status: 200, description: 'Danh sách reminder' })
  async getSlotReminders(@Param('slotId') slotId: string) {
    return this.reminderService.getSlotReminders(slotId);
  }
}
