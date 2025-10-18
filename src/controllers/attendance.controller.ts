import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
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
import { User } from '../decorators/user.decorator';
import type { JwtPayload } from '../types/jwt';

@ApiTags('Attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('register/:slotId')
  @ApiOperation({ summary: 'Đăng ký tham gia slot' })
  @ApiParam({ name: 'slotId', description: 'ID của slot' })
  @ApiResponse({ status: 201, description: 'Đã đăng ký slot thành công' })
  @ApiResponse({ status: 400, description: 'Đã đăng ký slot này trước đó' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy slot' })
  async registerForSlot(
    @User() { _id }: JwtPayload,
    @Param('slotId') slotId: string,
  ) {
    return this.attendanceService.registerForSlot(_id, slotId);
  }

  @Post('start/:slotId')
  @ApiOperation({ summary: 'Bắt đầu tham gia slot' })
  @ApiParam({ name: 'slotId', description: 'ID của slot' })
  @ApiResponse({ status: 200, description: 'Đã bắt đầu tham gia slot' })
  @ApiResponse({ status: 404, description: 'Chưa đăng ký slot này' })
  @ApiResponse({
    status: 400,
    description: 'Không thể bắt đầu tham gia slot này',
  })
  async startAttending(
    @User() { _id }: JwtPayload,
    @Param('slotId') slotId: string,
  ) {
    return this.attendanceService.startAttending(_id, slotId);
  }

  @Post('complete/:slotId')
  @ApiOperation({ summary: 'Đánh dấu tham gia - hoàn thành tham gia' })
  @ApiParam({ name: 'slotId', description: 'ID slot' })
  @ApiResponse({ status: 200, description: 'Hoàn thành tham gia' })
  @ApiResponse({ status: 400, description: 'Phải bắt đầu tham gia trước' })
  async completeAttendance(
    @User() { _id }: JwtPayload,
    @Param('slotId') slotId: string,
  ) {
    return this.attendanceService.completeAttendance(_id, slotId);
  }

  @Post('absent/:slotId')
  @ApiOperation({ summary: 'Đánh dấu vắng mặt' })
  @ApiParam({ name: 'slotId', description: 'ID slot' })
  @ApiResponse({ status: 200, description: 'Đã đánh dấu là vắng mặt' })
  @ApiResponse({ status: 404, description: 'Chưa đăng ký' })
  async markAbsent(
    @User() { _id }: JwtPayload,
    @Param('slotId') slotId: string,
  ) {
    return this.attendanceService.markAbsent(_id, slotId);
  }

  @Delete('cancel/:slotId')
  @ApiOperation({ summary: 'Hủy đăng ký' })
  @ApiParam({ name: 'slotId', description: 'ID slot' })
  @ApiResponse({ status: 200, description: 'Đã hủy đăng ký' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy đăng ký' })
  async cancelRegistration(
    @User() { _id }: JwtPayload,
    @Param('slotId') slotId: string,
  ) {
    return this.attendanceService.cancelRegistration(_id, slotId);
  }

  @Get('my-attendances')
  @ApiOperation({ summary: 'Lấy danh sách tham gia của người dùng' })
  @ApiQuery({ name: 'status', required: false, enum: AttendanceStatus })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Danh sách tham gia của người dùng',
  })
  async getUserAttendances(
    @User() { _id }: JwtPayload,
    @Query('status') status?: AttendanceStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.attendanceService.getUserAttendances(_id, status, page, limit);
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
    @User() { _id }: JwtPayload,
    @Param('slotId') slotId: string,
  ) {
    const isRegistered = await this.attendanceService.isRegistered(_id, slotId);
    return { isRegistered };
  }

  @Get('slot/:slotId/my-attendance')
  @ApiOperation({
    summary: 'Lấy thông tin tham gia của người dùng cho slot cụ thể',
  })
  @ApiParam({ name: 'slotId', description: 'ID slot' })
  @ApiResponse({ status: 200, description: 'Chi tiết tham gia' })
  async getUserSlotAttendance(
    @User() { _id }: JwtPayload,
    @Param('slotId') slotId: string,
  ) {
    return this.attendanceService.getUserSlotAttendance(_id, slotId);
  }
}
