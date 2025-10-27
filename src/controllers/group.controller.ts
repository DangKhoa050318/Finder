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
import { GroupService } from '../services/group.service';
import { CreateGroupDto, UpdateGroupDto } from '../dtos/group.dto';
import { InviteUserDto, RespondJoinRequestDto } from '../dtos/group.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { GroupVisibility } from '../models/group.schema';

@ApiTags('Groups')
@ApiBearerAuth()
@Controller('groups')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo một group' })
  @ApiResponse({ status: 201, description: 'Group đã được tạo thành công' })
  @ApiResponse({ status: 400, description: 'Yêu cầu không hợp lệ' })
  async createGroup(@User() { _id }: JwtPayload, @Body() dto: CreateGroupDto) {
    return this.groupService.createGroup(
      _id,
      dto.group_name,
      dto.description,
      dto.visibility,
      dto.max_member,
    );
  }

  @Put(':groupId')
  @ApiOperation({ summary: 'Cập nhật group (Chỉ dành cho leader)' })
  @ApiParam({ name: 'groupId', description: 'ID group' })
  @ApiResponse({
    status: 200,
    description: 'Group đã được cập nhật thành công',
  })
  @ApiResponse({ status: 403, description: 'Chỉ leader mới có thể cập nhật' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy group' })
  async updateGroup(
    @User() { _id }: JwtPayload,
    @Param('groupId') groupId: string,
    @Body() dto: UpdateGroupDto,
  ) {
    return this.groupService.updateGroup(groupId, _id, dto);
  }

  @Delete(':groupId')
  @ApiOperation({ summary: 'Xóa group (Chỉ dành cho leader)' })
  @ApiParam({ name: 'groupId', description: 'ID group' })
  @ApiResponse({ status: 200, description: 'Group đã được xóa thành công' })
  @ApiResponse({ status: 403, description: 'Chỉ leader mới có thể xóa' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy group' })
  async deleteGroup(
    @User() { _id }: JwtPayload,
    @Param('groupId') groupId: string,
  ) {
    return this.groupService.deleteGroup(groupId, _id);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy tất cả các group với lọc' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'visibility', required: false, enum: GroupVisibility })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Danh sách các group với pagination',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          description: 'Mảng các group, mỗi group có memberCount',
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  })
  async getGroups(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('visibility') visibility?: GroupVisibility,
    @Query('search') search?: string,
  ) {
    return this.groupService.getGroups(page, limit, visibility, search);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Lấy danh sách các group của user' })
  @ApiParam({ name: 'userId', description: 'ID người dùng' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách các group mà user tham gia',
    schema: {
      type: 'array',
      description: 'Mảng các group với memberCount',
    },
  })
  @ApiResponse({ status: 404, description: 'Người dùng không tồn tại' })
  async getUserGroups(@Param('userId') userId: string) {
    return this.groupService.getUserGroups(userId);
  }

  @Get(':groupId')
  @ApiOperation({ summary: 'Lấy group theo ID' })
  @ApiParam({ name: 'groupId', description: 'ID group' })
  @ApiResponse({ status: 200, description: 'Chi tiết group' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy group' })
  async getGroupById(@Param('groupId') groupId: string) {
    return this.groupService.getGroupById(groupId);
  }

  @Post(':groupId/join')
  @ApiOperation({ summary: 'Tham gia một group' })
  @ApiParam({ name: 'groupId', description: 'ID group' })
  @ApiResponse({ status: 200, description: 'Tham gia group thành công' })
  @ApiResponse({
    status: 400,
    description: 'Đã là thành viên hoặc group đã đầy',
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy group' })
  async joinGroup(
    @User() { _id }: JwtPayload,
    @Param('groupId') groupId: string,
  ) {
    return this.groupService.joinGroup(groupId, _id);
  }

  @Post(':groupId/requests/:notificationId/respond')
  @ApiOperation({ summary: 'Leader duyệt yêu cầu tham gia nhóm' })
  async respondJoinRequest(
    @User() { _id }: JwtPayload,
    @Param('groupId') groupId: string,
    @Param('notificationId') notificationId: string,
    @Body() dto: RespondJoinRequestDto,
  ) {
    return this.groupService.respondToJoinRequest(
      groupId,
      _id,
      notificationId,
      dto.approve,
    );
  }

  @Post(':groupId/invite')
  @ApiOperation({ summary: 'Mời người khác vào nhóm' })
  async inviteUser(
    @User() { _id }: JwtPayload,
    @Param('groupId') groupId: string,
    @Body() dto: InviteUserDto,
  ) {
    return this.groupService.inviteUser(groupId, _id, dto.target_user_id);
  }

  @Post(':groupId/invite/:notificationId/accept')
  @ApiOperation({ summary: 'Người được mời chấp nhận lời mời' })
  async acceptInvite(
    @User() { _id }: JwtPayload,
    @Param('groupId') groupId: string,
    @Param('notificationId') notificationId: string,
  ) {
    return this.groupService.acceptInvite(notificationId, _id);
  }

  @Post(':groupId/leave')
  @ApiOperation({ summary: 'Rời khỏi một group' })
  @ApiParam({ name: 'groupId', description: 'ID group' })
  @ApiResponse({ status: 200, description: 'Rời group thành công' })
  @ApiResponse({ status: 400, description: 'Leader không thể rời' })
  @ApiResponse({ status: 404, description: 'Không phải là thành viên' })
  async leaveGroup(
    @User() { _id }: JwtPayload,
    @Param('groupId') groupId: string,
  ) {
    return this.groupService.leaveGroup(groupId, _id);
  }

  @Get(':groupId/members')
  @ApiOperation({ summary: 'Lấy thành viên của group' })
  @ApiParam({ name: 'groupId', description: 'ID group' })
  @ApiResponse({ status: 200, description: 'Danh sách thành viên' })
  async getGroupMembers(@Param('groupId') groupId: string) {
    return this.groupService.getGroupMembers(groupId);
  }

  @Delete(':groupId/members/:memberId')
  @ApiOperation({ summary: 'Xóa thành viên khỏi group (Chỉ dành cho leader)' })
  @ApiParam({ name: 'groupId', description: 'ID group' })
  @ApiParam({ name: 'memberId', description: 'ID người dùng thành viên' })
  @ApiResponse({ status: 200, description: 'Đã xóa thành viên thành công' })
  @ApiResponse({
    status: 403,
    description: 'Chỉ leader mới có thể xóa thành viên',
  })
  async removeMember(
    @User() { _id }: JwtPayload,
    @Param('groupId') groupId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.groupService.removeMember(groupId, _id, memberId);
  }
}
