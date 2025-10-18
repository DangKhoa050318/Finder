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
import { GroupService } from '../services/group.service';
import { CreateGroupDto, UpdateGroupDto } from '../dtos/group.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { GroupVisibility } from '../models/group.schema';

@ApiTags('Groups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('groups')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo một group' })
  @ApiResponse({ status: 201, description: 'Group đã được tạo thành công' })
  @ApiResponse({ status: 400, description: 'Yêu cầu không hợp lệ' })
  async createGroup(
    @Request() req,
    @Body() dto: CreateGroupDto,
  ) {
    return this.groupService.createGroup(
      req.user.id,
      dto.group_name,
      dto.description,
      dto.visibility,
      dto.max_member,
    );
  }

  @Put(':groupId')
  @ApiOperation({ summary: 'Cập nhật group (Chỉ dành cho leader)' })
  @ApiParam({ name: 'groupId', description: 'ID group' })
  @ApiResponse({ status: 200, description: 'Group đã được cập nhật thành công' })
  @ApiResponse({ status: 403, description: 'Chỉ leader mới có thể cập nhật' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy group' })
  async updateGroup(
    @Request() req,
    @Param('groupId') groupId: string,
    @Body() dto: UpdateGroupDto,
  ) {
    return this.groupService.updateGroup(groupId, req.user.id, dto);
  }

  @Delete(':groupId')
  @ApiOperation({ summary: 'Xóa group (Chỉ dành cho leader)' })
  @ApiParam({ name: 'groupId', description: 'ID group' })
  @ApiResponse({ status: 200, description: 'Group đã được xóa thành công' })
  @ApiResponse({ status: 403, description: 'Chỉ leader mới có thể xóa' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy group' })
  async deleteGroup(
    @Request() req,
    @Param('groupId') groupId: string,
  ) {
    return this.groupService.deleteGroup(groupId, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy tất cả các group với lọc' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'visibility', required: false, enum: GroupVisibility })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Danh sách các group' })
  async getGroups(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('visibility') visibility?: GroupVisibility,
    @Query('search') search?: string,
  ) {
    return this.groupService.getGroups(page, limit, visibility, search);
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
  @ApiResponse({ status: 400, description: 'Đã là thành viên hoặc group đã đầy' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy group' })
  async joinGroup(
    @Request() req,
    @Param('groupId') groupId: string,
  ) {
    return this.groupService.joinGroup(groupId, req.user.id);
  }

  @Post(':groupId/leave')
  @ApiOperation({ summary: 'Rời khỏi một group' })
  @ApiParam({ name: 'groupId', description: 'ID group' })
  @ApiResponse({ status: 200, description: 'Rời group thành công' })
  @ApiResponse({ status: 400, description: 'Leader không thể rời' })
  @ApiResponse({ status: 404, description: 'Không phải là thành viên' })
  async leaveGroup(
    @Request() req,
    @Param('groupId') groupId: string,
  ) {
    return this.groupService.leaveGroup(groupId, req.user.id);
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
  @ApiResponse({ status: 403, description: 'Chỉ leader mới có thể xóa thành viên' })
  async removeMember(
    @Request() req,
    @Param('groupId') groupId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.groupService.removeMember(groupId, req.user.id, memberId);
  }
}
