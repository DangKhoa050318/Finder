import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { FriendService } from '../services/friend.service';
import { SendFriendRequestDto } from '../dtos/friend.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('Friends')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('friends')
export class FriendController {
  constructor(private readonly friendService: FriendService) {}

  @Post('request')
  @ApiOperation({ summary: 'Gửi lời mời kết bạn' })
  @ApiResponse({ status: 201, description: 'Lời mời kết bạn đã được gửi thành công' })
  @ApiResponse({ status: 400, description: 'Yêu cầu không hợp lệ (đã là bạn bè hoặc yêu cầu đã tồn tại)' })
  async sendFriendRequest(
    @Request() req,
    @Body() dto: SendFriendRequestDto,
  ) {
    return this.friendService.sendFriendRequest(req.user.id, dto.requestee_id);
  }

  @Post('request/:requestId/accept')
  @ApiOperation({ summary: 'Chấp nhận lời mời kết bạn' })
  @ApiParam({ name: 'requestId', description: 'ID lời mời kết bạn' })
  @ApiResponse({ status: 200, description: 'Lời mời kết bạn đã được chấp nhận' })
  @ApiResponse({ status: 404, description: 'Lời mời kết bạn không tồn tại' })
  async acceptFriendRequest(
    @Request() req,
    @Param('requestId') requestId: string,
  ) {
    return this.friendService.acceptFriendRequest(requestId, req.user.id);
  }

  @Post('request/:requestId/reject')
  @ApiOperation({ summary: 'Từ chối lời mời kết bạn' })
  @ApiParam({ name: 'requestId', description: 'ID lời mời kết bạn' })
  @ApiResponse({ status: 200, description: 'Lời mời kết bạn đã bị từ chối' })
  @ApiResponse({ status: 404, description: 'Lời mời kết bạn không tồn tại' })
  async rejectFriendRequest(
    @Request() req,
    @Param('requestId') requestId: string,
  ) {
    return this.friendService.rejectFriendRequest(requestId, req.user.id);
  }

  @Delete('request/:requestId')
  @ApiOperation({ summary: 'Hủy lời mời kết bạn (Bởi người gửi)' })
  @ApiParam({ name: 'requestId', description: 'ID lời mời kết bạn' })
  @ApiResponse({ status: 200, description: 'Lời mời kết bạn đã bị hủy' })
  @ApiResponse({ status: 404, description: 'Lời mời kết bạn không tồn tại' })
  async cancelFriendRequest(
    @Request() req,
    @Param('requestId') requestId: string,
  ) {
    return this.friendService.cancelFriendRequest(requestId, req.user.id);
  }

  @Get('requests/pending')
  @ApiOperation({ summary: 'Lấy danh sách lời mời kết bạn đang chờ (đã nhận)' })
  @ApiResponse({ status: 200, description: 'Danh sách lời mời đang chờ' })
  async getPendingRequests(@Request() req) {
    return this.friendService.getPendingRequests(req.user.id);
  }

  @Get('requests/sent')
  @ApiOperation({ summary: 'Lấy danh sách lời mời kết bạn đã gửi' })
  @ApiResponse({ status: 200, description: 'Danh sách lời mời đã gửi' })
  async getSentRequests(@Request() req) {
    return this.friendService.getSentRequests(req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách bạn bè' })
  @ApiResponse({ status: 200, description: 'Danh sách bạn bè' })
  async getFriends(@Request() req) {
    return this.friendService.getFriends(req.user.id);
  }

  @Delete(':friendId')
  @ApiOperation({ summary: 'Hủy kết bạn' })
  @ApiParam({ name: 'friendId', description: 'ID người bạn' })
  @ApiResponse({ status: 200, description: 'Hủy kết bạn thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy mối quan hệ bạn bè' })
  @HttpCode(HttpStatus.OK)
  async unfriend(
    @Request() req,
    @Param('friendId') friendId: string,
  ) {
    return this.friendService.unfriend(req.user.id, friendId);
  }

  @Get('check/:userId')
  @ApiOperation({ summary: 'Kiểm tra xem người dùng có phải là bạn bè không' })
  @ApiParam({ name: 'userId', description: 'ID người dùng để kiểm tra' })
  @ApiResponse({ status: 200, description: 'Trả về true/false' })
  async areFriends(
    @Request() req,
    @Param('userId') userId: string,
  ) {
    const areFriends = await this.friendService.areFriends(req.user.id, userId);
    return { areFriends };
  }
}
