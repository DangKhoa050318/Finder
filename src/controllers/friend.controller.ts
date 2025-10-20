import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { User } from '../decorators/user.decorator';
import type { JwtPayload } from '../types/jwt';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { FriendService } from '../services/friend.service';
import {
  SendFriendRequestDto,
  SuggestedFriendDto,
  FriendRequestResponseDto,
  FriendResponseDto,
  FriendshipStatusDto,
  MessageResponseDto,
} from '../dtos/friend.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('Friends')
@ApiBearerAuth()
@Controller('friends')
export class FriendController {
  constructor(private readonly friendService: FriendService) {}

  @Post('request')
  @ApiOperation({ summary: 'Gửi lời mời kết bạn' })
  @ApiResponse({
    status: 201,
    description: 'Lời mời kết bạn đã được gửi thành công',
    type: FriendRequestResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Yêu cầu không hợp lệ (đã là bạn bè hoặc yêu cầu đã tồn tại)',
  })
  async sendFriendRequest(
    @User() { _id }: JwtPayload,
    @Body() dto: SendFriendRequestDto,
  ) {
    return this.friendService.sendFriendRequest(_id, dto.requestee_id);
  }

  @Post('request/:requestId/accept')
  @ApiOperation({ summary: 'Chấp nhận lời mời kết bạn' })
  @ApiParam({ name: 'requestId', description: 'ID lời mời kết bạn' })
  @ApiResponse({
    status: 200,
    description: 'Lời mời kết bạn đã được chấp nhận',
    type: Object,
  })
  @ApiResponse({ status: 404, description: 'Lời mời kết bạn không tồn tại' })
  async acceptFriendRequest(
    @User() { _id }: JwtPayload,
    @Param('requestId') requestId: string,
  ) {
    return this.friendService.acceptFriendRequest(requestId, _id);
  }

  @Post('request/:requestId/reject')
  @ApiOperation({ summary: 'Từ chối lời mời kết bạn' })
  @ApiParam({ name: 'requestId', description: 'ID lời mời kết bạn' })
  @ApiResponse({
    status: 200,
    description: 'Lời mời kết bạn đã bị từ chối',
    type: FriendRequestResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Lời mời kết bạn không tồn tại' })
  async rejectFriendRequest(
    @User() { _id }: JwtPayload,
    @Param('requestId') requestId: string,
  ) {
    return this.friendService.rejectFriendRequest(requestId, _id);
  }

  @Delete('request/:requestId')
  @ApiOperation({ summary: 'Hủy lời mời kết bạn (Bởi người gửi)' })
  @ApiParam({ name: 'requestId', description: 'ID lời mời kết bạn' })
  @ApiResponse({
    status: 200,
    description: 'Lời mời kết bạn đã bị hủy',
    type: FriendRequestResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Lời mời kết bạn không tồn tại' })
  async cancelFriendRequest(
    @User() { _id }: JwtPayload,
    @Param('requestId') requestId: string,
  ) {
    return this.friendService.cancelFriendRequest(requestId, _id);
  }

  @Get('requests/pending')
  @ApiOperation({ summary: 'Lấy danh sách lời mời kết bạn đang chờ (đã nhận)' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách lời mời đang chờ',
    type: [FriendRequestResponseDto],
  })
  async getPendingRequests(@User() { _id }: JwtPayload) {
    return this.friendService.getPendingRequests(_id);
  }

  @Get('requests/sent')
  @ApiOperation({ summary: 'Lấy danh sách lời mời kết bạn đã gửi' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách lời mời đã gửi',
    type: [FriendRequestResponseDto],
  })
  async getSentRequests(@User() { _id }: JwtPayload) {
    return this.friendService.getSentRequests(_id);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách bạn bè' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách bạn bè',
    type: [FriendResponseDto],
  })
  async getFriends(@User() { _id }: JwtPayload) {
    return this.friendService.getFriends(_id);
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Lấy danh sách bạn bè gợi ý' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách bạn bè gợi ý dựa trên ngành học và lịch rảnh chung',
    type: [SuggestedFriendDto],
  })
  async getSuggestedFriends(@User() { _id }: JwtPayload) {
    return this.friendService.getSuggestedFriends(_id);
  }

  @Delete(':friendId')
  @ApiOperation({ summary: 'Hủy kết bạn' })
  @ApiParam({ name: 'friendId', description: 'ID người bạn' })
  @ApiResponse({
    status: 200,
    description: 'Hủy kết bạn thành công',
    type: MessageResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy mối quan hệ bạn bè',
  })
  @HttpCode(HttpStatus.OK)
  async unfriend(
    @User() { _id }: JwtPayload,
    @Param('friendId') friendId: string,
  ) {
    return this.friendService.unfriend(_id, friendId);
  }

  @Get('check/:userId')
  @ApiOperation({ summary: 'Kiểm tra xem người dùng có phải là bạn bè không' })
  @ApiParam({ name: 'userId', description: 'ID người dùng để kiểm tra' })
  @ApiResponse({
    status: 200,
    description: 'Trả về true/false',
    type: FriendshipStatusDto,
  })
  async areFriends(
    @User() { _id }: JwtPayload,
    @Param('userId') userId: string,
  ) {
    const areFriends = await this.friendService.areFriends(_id, userId);
    return { areFriends };
  }
}
