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
import { SlotService } from '../services/slot.service';
import {
  CreateGroupSlotDto,
  CreatePrivateSlotDto,
  UpdateSlotDto,
  GetSlotsDto,
  SlotResponseDto,
  SlotListResponseDto,
} from '../dtos/slot.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { SlotType } from '../models/slot.schema';

@ApiTags('Slots')
@ApiBearerAuth()
@Controller('slots')
export class SlotController {
  constructor(private readonly slotService: SlotService) {}

  @Post('group')
  @ApiOperation({ summary: 'Tạo một group slot' })
  @ApiResponse({
    status: 201,
    description: 'Group slot đã được tạo thành công',
    type: SlotResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Yêu cầu không hợp lệ (thời gian không hợp lệ)',
  })
  async createGroupSlot(
    @User() { _id }: JwtPayload,
    @Body() dto: CreateGroupSlotDto,
  ) {
    const startTime = new Date(dto.start_time);
    const endTime = new Date(dto.end_time);

    return this.slotService.createGroupSlot(
      _id,
      dto.group_id,
      dto.title,
      dto.description || '',
      startTime,
      endTime,
      dto.attachments,
    );
  }

  @Post('private')
  @ApiOperation({ summary: 'Tạo một slot riêng tư (1-1)' })
  @ApiResponse({
    status: 201,
    description: 'Slot riêng tư đã được tạo thành công',
  })
  @ApiResponse({
    status: 400,
    description: 'Yêu cầu không hợp lệ (thời gian không hợp lệ)',
  })
  async createPrivateSlot(
    @User() { _id }: JwtPayload,
    @Body() dto: CreatePrivateSlotDto,
  ) {
    const startTime = new Date(dto.start_time);
    const endTime = new Date(dto.end_time);

    return this.slotService.createPrivateSlot(
      _id,
      dto.friend_id,
      dto.title,
      dto.description || '',
      startTime,
      endTime,
      dto.attachments,
    );
  }

  @Put(':slotId')
  @ApiOperation({ summary: 'Cập nhật slot (Chỉ dành cho người tạo)' })
  @ApiParam({ name: 'slotId', description: 'ID slot' })
  @ApiResponse({
    status: 200,
    description: 'Slot đã được cập nhật thành công',
    type: SlotResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Chỉ người tạo mới có thể cập nhật',
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy slot' })
  async updateSlot(
    @User() { _id }: JwtPayload,
    @Param('slotId') slotId: string,
    @Body() dto: UpdateSlotDto,
  ) {
    const updates: any = { ...dto };
    if (dto.start_time) updates.start_time = new Date(dto.start_time);
    if (dto.end_time) updates.end_time = new Date(dto.end_time);

    return this.slotService.updateSlot(slotId, _id, updates);
  }

  @Delete(':slotId')
  @ApiOperation({ summary: 'Xóa slot (Chỉ dành cho người tạo)' })
  @ApiParam({ name: 'slotId', description: 'ID slot' })
  @ApiResponse({ status: 200, description: 'Slot đã được xóa thành công' })
  @ApiResponse({ status: 403, description: 'Chỉ người tạo mới có thể xóa' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy slot' })
  async deleteSlot(
    @User() { _id }: JwtPayload,
    @Param('slotId') slotId: string,
  ) {
    return this.slotService.deleteSlot(slotId, _id);
  }

  @Get('my-slots')
  @ApiOperation({
    summary:
      'Lấy danh sách slot của người dùng hiện tại (đã tạo hoặc tham gia)',
  })
  @ApiQuery({ name: 'slot_type', required: false, enum: SlotType })
  @ApiResponse({
    status: 200,
    description: 'Danh sách các slot',
    type: SlotListResponseDto,
  })
  async getUserSlots(
    @User() { _id }: JwtPayload,
    @Query('slot_type') slotType?: SlotType,
  ) {
    return this.slotService.getUserSlots(_id, slotType);
  }

  @Get('my-slots/created')
  @ApiOperation({ summary: 'Lấy danh sách slot user đã tạo' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách slot đã tạo',
    type: SlotListResponseDto,
  })
  async getUserCreatedSlots(@User() { _id }: JwtPayload) {
    return this.slotService.getUserCreatedSlots(_id);
  }

  @Get('my-slots/group')
  @ApiOperation({ summary: 'Lấy danh sách slot nhóm của user' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách slot nhóm',
    type: SlotListResponseDto,
  })
  async getUserGroupSlots(@User() { _id }: JwtPayload) {
    return this.slotService.getUserGroupSlots(_id);
  }

  @Get('my-slots/private')
  @ApiOperation({ summary: 'Lấy danh sách slot riêng tư của user' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách slot riêng tư',
    type: SlotListResponseDto,
  })
  async getUserPrivateSlots(@User() { _id }: JwtPayload) {
    return this.slotService.getUserPrivateSlots(_id);
  }

  @Get('my-slots/registered')
  @ApiOperation({ summary: 'Lấy danh sách slot user đã đăng ký tham gia' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách slot đã đăng ký',
    type: SlotListResponseDto,
  })
  async getUserRegisteredSlots(@User() { _id }: JwtPayload) {
    return this.slotService.getUserRegisteredSlots(_id);
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Lấy slot sắp tới (7 ngày tới)' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách các slot sắp tới',
    type: SlotListResponseDto,
  })
  async getUpcomingSlots(@User() { _id }: JwtPayload) {
    return this.slotService.getUpcomingSlots(_id);
  }

  @Get('group/:groupId')
  @ApiOperation({ summary: 'Lấy slot theo group' })
  @ApiParam({ name: 'groupId', description: 'ID group' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách các slot của group',
    type: SlotListResponseDto,
  })
  async getGroupSlots(@Param('groupId') groupId: string) {
    return this.slotService.getGroupSlots(groupId);
  }

  @Post(':slotId/approve')
  @ApiOperation({ summary: 'Phê duyệt slot pending (Leader only)' })
  @ApiParam({ name: 'slotId', description: 'ID của slot cần phê duyệt' })
  @ApiResponse({
    status: 200,
    description: 'Slot đã được phê duyệt thành công',
    type: SlotResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy slot' })
  @ApiResponse({
    status: 403,
    description: 'Chỉ lãnh đạo nhóm mới có thể phê duyệt',
  })
  @ApiResponse({
    status: 400,
    description: 'Slot không cần phê duyệt',
  })
  async approveSlot(
    @Param('slotId') slotId: string,
    @User() user: JwtPayload,
  ) {
    return this.slotService.approveSlot(slotId, user._id);
  }

  @Post(':slotId/reject')
  @ApiOperation({ summary: 'Từ chối slot pending (Leader only)' })
  @ApiParam({ name: 'slotId', description: 'ID của slot cần từ chối' })
  @ApiResponse({
    status: 200,
    description: 'Slot đã bị từ chối',
    type: SlotResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy slot' })
  @ApiResponse({
    status: 403,
    description: 'Chỉ lãnh đạo nhóm mới có thể từ chối',
  })
  @ApiResponse({
    status: 400,
    description: 'Slot không thể từ chối',
  })
  async rejectSlot(
    @Param('slotId') slotId: string,
    @Body('reason') reason: string,
    @User() user: JwtPayload,
  ) {
    return this.slotService.rejectSlot(slotId, user._id, reason);
  }

  @Get(':slotId')
  @ApiOperation({ summary: 'Lấy slot theo ID' })
  @ApiParam({ name: 'slotId', description: 'ID slot' })
  @ApiResponse({
    status: 200,
    description: 'Chi tiết slot',
    type: SlotResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy slot' })
  async getSlotById(@Param('slotId') slotId: string) {
    return this.slotService.getSlotById(slotId);
  }
}
