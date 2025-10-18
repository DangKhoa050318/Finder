import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AvailabilityService } from '../services/availability.service';
import {
  CreateAvailabilityDto,
  UpdateAvailabilityDto,
  AvailabilityResponseDto,
  AvailabilityListResponseDto,
} from '../dtos/availability.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { User } from '../decorators/user.decorator';
import type { JwtPayload } from '../types/jwt';
import { Public } from '../decorators/public.decorator';

@ApiTags('Availability')
@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Tạo khung giờ rảnh' })
  @ApiResponse({
    status: 201,
    description: 'Khung giờ rảnh đã được tạo thành công',
    type: AvailabilityResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Thời gian không hợp lệ hoặc bị chồng lấp',
  })
  create(@Body() dto: CreateAvailabilityDto) {
    return this.availabilityService.create(dto);
  }

  @Public()
  @Get('user/:userId')
  @ApiOperation({ summary: 'Lấy danh sách khung giờ rảnh theo người dùng' })
  @ApiParam({ name: 'userId', description: 'ID người dùng' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách khung giờ rảnh',
    type: [AvailabilityResponseDto],
  })
  listByUser(@Param('userId') userId: string) {
    return this.availabilityService.listByUser(userId);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Cập nhật khung giờ rảnh' })
  @ApiParam({ name: 'id', description: 'ID khung giờ rảnh' })
  @ApiResponse({
    status: 200,
    description: 'Khung giờ rảnh đã được cập nhật thành công',
    type: AvailabilityResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy khung giờ rảnh' })
  @ApiResponse({
    status: 400,
    description: 'Thời gian không hợp lệ hoặc bị chồng lấp',
  })
  update(@Param('id') id: string, @Body() dto: UpdateAvailabilityDto) {
    return this.availabilityService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Xóa khung giờ rảnh' })
  @ApiParam({ name: 'id', description: 'ID khung giờ rảnh' })
  @ApiResponse({
    status: 200,
    description: 'Khung giờ rảnh đã được xóa thành công',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Availability deleted successfully',
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy khung giờ rảnh' })
  remove(@Param('id') id: string) {
    return this.availabilityService.remove(id);
  }
}
