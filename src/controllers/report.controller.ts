import {
  Controller,
  Get,
  Post,
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
import { ReportService } from '../services/report.service';
import { CreateReportDto } from '../dtos/report.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Role } from '../models/user.schema';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo báo cáo' })
  @ApiResponse({ status: 201, description: 'Báo cáo đã được tạo thành công' })
  @ApiResponse({ status: 400, description: 'Yêu cầu không hợp lệ' })
  async createReport(
    @User() { _id }: JwtPayload,
    @Body() dto: CreateReportDto,
  ) {
    return this.reportService.createReport(_id, dto.reported_id, dto.reason);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({
    summary: 'Lấy danh sách tất cả báo cáo (Chỉ dành cho admin)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Danh sách báo cáo' })
  async getAllReports(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.reportService.getAllReports(page, limit);
  }

  @Get('user/:userId')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({
    summary: 'Lấy danh sách báo cáo theo người bị báo cáo (Chỉ dành cho admin)',
  })
  @ApiParam({ name: 'userId', description: 'ID người dùng bị báo cáo' })
  @ApiResponse({ status: 200, description: 'Danh sách báo cáo' })
  async getReportsByReportedUser(@Param('userId') userId: string) {
    return this.reportService.getReportsByReportedUser(userId);
  }

  @Get('my-reports')
  @ApiOperation({ summary: 'Lấy danh sách báo cáo của người dùng hiện tại' })
  @ApiResponse({ status: 200, description: 'Danh sách báo cáo' })
  async getMyReports(@User() { _id }: JwtPayload) {
    return this.reportService.getReportsByReporter(_id);
  }

  @Get(':reportId')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Lấy báo cáo theo ID (Chỉ dành cho admin)' })
  @ApiParam({ name: 'reportId', description: 'ID báo cáo' })
  @ApiResponse({ status: 200, description: 'Chi tiết báo cáo' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy báo cáo' })
  async getReportById(@Param('reportId') reportId: string) {
    return this.reportService.getReportById(reportId);
  }

  @Delete(':reportId')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Xóa báo cáo (Chỉ dành cho admin)' })
  @ApiParam({ name: 'reportId', description: 'ID báo cáo' })
  @ApiResponse({ status: 200, description: 'Báo cáo đã bị xóa' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy báo cáo' })
  async deleteReport(@Param('reportId') reportId: string) {
    return this.reportService.deleteReport(reportId);
  }

  @Get('count/:userId')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({
    summary: 'Lấy số lượng báo cáo cho người dùng (Chỉ dành cho admin)',
  })
  @ApiParam({ name: 'userId', description: 'ID người dùng' })
  @ApiResponse({ status: 200, description: 'Số lượng báo cáo' })
  async getReportCount(@Param('userId') userId: string) {
    const count = await this.reportService.getReportCount(userId);
    return { count };
  }
}
