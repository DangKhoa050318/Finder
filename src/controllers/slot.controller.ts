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
