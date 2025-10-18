import {
  Controller,
  Get,
  Post,
  Delete,
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
import { AttendanceService } from '../services/attendance.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AttendanceStatus } from '../models/attendance.schema';

@ApiTags('Attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('register/:slotId')
  @ApiOperation({ summary: 'Đăng ký một slot' })
  @ApiParam({ name: 'slotId', description: 'ID slot' })
  @ApiResponse({ status: 201, description: 'Đăng ký thành công' })
  @ApiResponse({ status: 400, description: 'Đã đăng ký' })
  async registerForSlot(
    @Request() req,
    @Param('slotId') slotId: string,
  ) {
    return this.attendanceService.registerForSlot(req.user.id, slotId);
  }

  @Post('start/:slotId')
  @ApiOperation({ summary: 'Đánh dấu tham gia - bắt đầu tham gia' })
  @ApiParam({ name: 'slotId', description: 'ID slot' })
  @ApiResponse({ status: 200, description: 'Bắt đầu tham gia' })
  @ApiResponse({ status: 404, description: 'Chưa đăng ký' })
  async startAttending(
    @Request() req,
    @Param('slotId') slotId: string,
  ) {
    return this.attendanceService.startAttending(req.user.id, slotId);
  }

  @Post('complete/:slotId')
  @ApiOperation({ summary: 'Đánh dấu tham gia - hoàn thành tham gia' })
  @ApiParam({ name: 'slotId', description: 'ID slot' })
  @ApiResponse({ status: 200, description: 'Hoàn thành tham gia' })
  @ApiResponse({ status: 400, description: 'Phải bắt đầu tham gia trước' })
  async completeAttendance(
    @Request() req,
    @Param('slotId') slotId: string,
  ) {
    return this.attendanceService.completeAttendance(req.user.id, slotId);
  }

  @Post('absent/:slotId')
  @ApiOperation({ summary: 'Đánh dấu vắng mặt' })
  @ApiParam({ name: 'slotId', description: 'ID slot' })
  @ApiResponse({ status: 200, description: 'Đã đánh dấu là vắng mặt' })
  @ApiResponse({ status: 404, description: 'Chưa đăng ký' })
  async markAbsent(
    @Request() req,
    @Param('slotId') slotId: string,
  ) {
    return this.attendanceService.markAbsent(req.user.id, slotId);
  }

  @Delete('cancel/:slotId')
  @ApiOperation({ summary: 'Hủy đăng ký' })
  @ApiParam({ name: 'slotId', description: 'ID slot' })
  @ApiResponse({ status: 200, description: 'Đã hủy đăng ký' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy đăng ký' })
  async cancelRegistration(
    @Request() req,
    @Param('slotId') slotId: string,
  ) {
    return this.attendanceService.cancelRegistration(req.user.id, slotId);
  }

  @Get('my-attendances')
  @ApiOperation({ summary: 'Lấy danh sách tham gia của người dùng' })
  @ApiQuery({ name: 'status', required: false, enum: AttendanceStatus })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Danh sách tham gia của người dùng' })
  async getUserAttendances(
    @Request() req,
    @Query('status') status?: AttendanceStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.attendanceService.getUserAttendances(
      req.user.id,
      status,
      page,
      limit,
    );
  }

  @Get('slot/:slotId/attendees')
  @ApiOperation({ summary: 'Lấy danh sách người tham gia của slot' })
  @ApiParam({ name: 'slotId', description: 'ID slot' })
  @ApiQuery({ name: 'status', required: false, enum: AttendanceStatus })
  @ApiResponse({ status: 200, description: 'Danh sách người tham gia' })
  async getSlotAttendees(
    @Param('slotId') slotId: string,
    @Query('status') status?: AttendanceStatus,
  ) {
    return this.attendanceService.getSlotAttendees(slotId, status);
  }

  @Get('slot/:slotId/statistics')
  @ApiOperation({ summary: 'Lấy thống kê tham gia cho một slot' })
  @ApiParam({ name: 'slotId', description: 'ID slot' })
  @ApiResponse({ status: 200, description: 'Thống kê tham gia' })
  async getSlotStatistics(@Param('slotId') slotId: string) {
    return this.attendanceService.getSlotStatistics(slotId);
  }

  @Get('check/:slotId')
  @ApiOperation({ summary: 'Kiểm tra người dùng đã đăng ký cho slot' })
  @ApiParam({ name: 'slotId', description: 'ID slot' })
  @ApiResponse({ status: 200, description: 'Trả về true/false' })
  async isRegistered(
    @Request() req,
    @Param('slotId') slotId: string,
  ) {
    const isRegistered = await this.attendanceService.isRegistered(
      req.user.id,
      slotId,
    );
    return { isRegistered };
  }

  @Get('slot/:slotId/my-attendance')
  @ApiOperation({ summary: 'Lấy thông tin tham gia của người dùng cho slot cụ thể' })
  @ApiParam({ name: 'slotId', description: 'ID slot' })
  @ApiResponse({ status: 200, description: 'Chi tiết tham gia' })
  async getUserSlotAttendance(
    @Request() req,
    @Param('slotId') slotId: string,
  ) {
    return this.attendanceService.getUserSlotAttendance(req.user.id, slotId);
  }
}
