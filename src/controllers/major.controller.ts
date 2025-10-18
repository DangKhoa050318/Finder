import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { MajorService } from '../services/major.service';
import { CreateMajorDto, UpdateMajorDto } from '../dtos/major.dto';
import { Public } from 'src/decorators/public.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Role } from '../models/user.schema';

@ApiTags('Majors')
@Controller('major')
export class MajorController {
  constructor(private majorService: MajorService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tất cả các ngành' })
  @ApiResponse({ status: 200, description: 'Danh sách các ngành' })
  async getMajors() {
    return this.majorService.getAll();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin ngành theo ID' })
  @ApiParam({ name: 'id', description: 'ID ngành' })
  @ApiResponse({ status: 200, description: 'Thông tin ngành' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy ngành' })
  async getMajorById(@Param('id') id: string) {
    return this.majorService.getById(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Tạo ngành mới (Chỉ dành cho admin)' })
  @ApiResponse({ status: 201, description: 'Ngành đã được tạo thành công' })
  @ApiResponse({ status: 400, description: 'Mã ngành đã tồn tại' })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập' })
  async createMajor(@Body() dto: CreateMajorDto) {
    return this.majorService.create(dto.key, dto.name);
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Cập nhật ngành (Chỉ dành cho admin)' })
  @ApiParam({ name: 'id', description: 'ID ngành' })
  @ApiResponse({
    status: 200,
    description: 'Ngành đã được cập nhật thành công',
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy ngành' })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập' })
  async updateMajor(@Param('id') id: string, @Body() dto: UpdateMajorDto) {
    if (!dto.name) {
      throw new Error('Name is required');
    }
    return this.majorService.update(id, dto.name);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Xóa ngành (Chỉ dành cho admin)' })
  @ApiParam({ name: 'id', description: 'ID ngành' })
  @ApiResponse({ status: 200, description: 'Ngành đã được xóa thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy ngành' })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập' })
  async deleteMajor(@Param('id') id: string) {
    return this.majorService.delete(id);
  }
}
