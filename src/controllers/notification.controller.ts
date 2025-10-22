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
import { NotificationService } from '../services/notification.service';
import {
  CreateNotificationDto,
  UpdateNotificationDto,
  GetNotificationsDto,
  MarkAsReadDto,
  DeleteNotificationDto,
} from '../dtos/notification.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * Get notifications for current user
   */
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách thông báo của người dùng' })
  @ApiQuery({ name: 'type', required: false, description: 'Loại thông báo' })
  @ApiQuery({
    name: 'unread_only',
    required: false,
    type: Boolean,
    description: 'Chỉ lấy thông báo chưa đọc',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({ status: 200, description: 'Danh sách thông báo' })
  async getNotifications(
    @User() { _id }: JwtPayload,
    @Query() query: GetNotificationsDto,
  ) {
    return this.notificationService.getUserNotifications(_id, query);
  }

  /**
   * Get unread notification count
   */
  @Get('unread-count')
  @ApiOperation({ summary: 'Lấy số lượng thông báo chưa đọc' })
  @ApiResponse({
    status: 200,
    description: 'Số lượng thông báo chưa đọc',
  })
  async getUnreadCount(@User() { _id }: JwtPayload) {
    const unreadCount = await this.notificationService.getUnreadCount(_id);
    return { unread_count: unreadCount };
  }

  /**
   * Get single notification
   */
  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông báo theo ID' })
  @ApiParam({ name: 'id', description: 'ID thông báo' })
  @ApiResponse({ status: 200, description: 'Chi tiết thông báo' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy thông báo' })
  async getNotification(@Param('id') id: string) {
    return this.notificationService.getNotificationById(id);
  }

  /**
   * Mark notifications as read
   */
  @Post('mark-as-read')
  @ApiOperation({ summary: 'Đánh dấu thông báo đã đọc' })
  @ApiResponse({ status: 200, description: 'Đánh dấu thành công' })
  async markAsRead(@User() { _id }: JwtPayload, @Body() dto: MarkAsReadDto) {
    return this.notificationService.markAsRead(_id, dto);
  }

  /**
   * Mark all notifications as read
   */
  @Post('mark-all-as-read')
  @ApiOperation({ summary: 'Đánh dấu tất cả thông báo đã đọc' })
  @ApiResponse({ status: 200, description: 'Đánh dấu thành công' })
  async markAllAsRead(@User() { _id }: JwtPayload) {
    return this.notificationService.markAllAsRead(_id);
  }

  /**
   * Update notification
   */
  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật thông báo' })
  @ApiParam({ name: 'id', description: 'ID thông báo' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy thông báo' })
  async updateNotification(
    @Param('id') id: string,
    @Body() dto: UpdateNotificationDto,
  ) {
    return this.notificationService.updateNotification(id, dto);
  }

  /**
   * Delete notifications
   */
  @Delete()
  @ApiOperation({ summary: 'Xóa thông báo' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  async deleteNotifications(
    @User() { _id }: JwtPayload,
    @Body() dto: DeleteNotificationDto,
  ) {
    return this.notificationService.deleteNotifications(_id, dto);
  }

  /**
   * Delete single notification
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Xóa một thông báo' })
  @ApiParam({ name: 'id', description: 'ID thông báo' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  async deleteNotification(
    @User() { _id }: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.notificationService.deleteNotifications(_id, {
      notification_ids: [id],
    });
  }

  /**
   * Delete all notifications
   */
  @Delete()
  @ApiOperation({ summary: 'Xóa tất cả thông báo' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  async deleteAllNotifications(@User() { _id }: JwtPayload) {
    return this.notificationService.deleteAllNotifications(_id);
  }
}
