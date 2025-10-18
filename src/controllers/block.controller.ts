import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { BlockService } from '../services/block.service';
import { BlockUserDto, UnblockUserDto } from '../dtos/block.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('Block')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('block')
export class BlockController {
  constructor(private readonly blockService: BlockService) {}

  @Post()
  @ApiOperation({ summary: 'Chặn một người dùng' })
  @ApiResponse({ status: 201, description: 'Đã chặn người dùng thành công' })
  @ApiResponse({ status: 400, description: 'Yêu cầu không hợp lệ (không thể chặn chính mình hoặc đã bị chặn)' })
  async blockUser(
    @Request() req,
    @Body() dto: BlockUserDto,
  ) {
    return this.blockService.blockUser(req.user.id, dto.blocked_id);
  }

  @Delete()
  @ApiOperation({ summary: 'Bỏ chặn một người dùng' })
  @ApiResponse({ status: 200, description: 'Bỏ chặn người dùng thành công' })
  @ApiResponse({ status: 404, description: 'Người dùng không có trong danh sách chặn' })
  async unblockUser(
    @Request() req,
    @Body() dto: UnblockUserDto,
  ) {
    return this.blockService.unblockUser(req.user.id, dto.blocked_id);
  }

  @Get('list')
  @ApiOperation({ summary: 'Lấy danh sách người dùng bị chặn' })
  @ApiResponse({ status: 200, description: 'Danh sách người dùng bị chặn' })
  async getBlockedUsers(@Request() req) {
    return this.blockService.getBlockedUsers(req.user.id);
  }

  @Get('check/:userId')
  @ApiOperation({ summary: 'Kiểm tra người dùng có bị chặn hay không' })
  @ApiParam({ name: 'userId', description: 'ID người dùng để kiểm tra' })
  @ApiResponse({ status: 200, description: 'Trả về true/false' })
  async isBlocked(
    @Request() req,
    @Param('userId') userId: string,
  ) {
    const isBlocked = await this.blockService.isBlocked(req.user.id, userId);
    return { isBlocked };
  }

  @Get('check-between/:userId')
  @ApiOperation({ summary: 'Kiểm tra có bất kỳ sự chặn nào giữa hai người dùng hay không' })
  @ApiParam({ name: 'userId', description: 'ID người dùng để kiểm tra' })
  @ApiResponse({ status: 200, description: 'Trả về true/false' })
  async hasBlockBetween(
    @Request() req,
    @Param('userId') userId: string,
  ) {
    const hasBlock = await this.blockService.hasBlockBetween(req.user.id, userId);
    return { hasBlock };
  }
}
