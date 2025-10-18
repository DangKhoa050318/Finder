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
import { CourseService } from '../services/course.service';
import {
  CreateCourseDto,
  UpdateCourseDto,
  CourseResponseDto,
  CourseListResponseDto,
} from '../dtos/course.dto';
import { Public } from '../decorators/public.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Role } from '../models/user.schema';

@ApiTags('Courses')
@Controller('courses')
export class CourseController {
  constructor(private courseService: CourseService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tất cả các môn học' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách các môn học',
    type: [CourseResponseDto],
  })
  async getCourses() {
    return this.courseService.getAll();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin môn học theo ID' })
  @ApiParam({ name: 'id', description: 'ID môn học' })
  @ApiResponse({
    status: 200,
    description: 'Thông tin môn học',
    type: CourseResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy môn học' })
  async getCourseById(@Param('id') id: string) {
    return this.courseService.getById(id);
  }

  @Post()
  @ApiBearerAuth()
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Tạo môn học mới (Chỉ dành cho admin)' })
  @ApiResponse({
    status: 201,
    description: 'Môn học đã được tạo thành công',
    type: CourseResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Mã môn học đã tồn tại' })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập' })
  async createCourse(@Body() dto: CreateCourseDto) {
    return this.courseService.create(dto.course_id, dto.course_name);
  }

  @Put(':id')
  @ApiBearerAuth()
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Cập nhật môn học (Chỉ dành cho admin)' })
  @ApiParam({ name: 'id', description: 'ID môn học' })
  @ApiResponse({
    status: 200,
    description: 'Môn học đã được cập nhật thành công',
    type: CourseResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy môn học' })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập' })
  async updateCourse(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    return this.courseService.update(id, dto.course_name);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Xóa môn học (Chỉ dành cho admin)' })
  @ApiParam({ name: 'id', description: 'ID môn học' })
  @ApiResponse({
    status: 200,
    description: 'Môn học đã được xóa thành công',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Đã xóa môn học thành công' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy môn học' })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập' })
  async deleteCourse(@Param('id') id: string) {
    return this.courseService.delete(id);
  }
}
