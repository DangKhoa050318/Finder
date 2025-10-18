import {
  Controller,
  Get,
  Post,
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
import { MajorCourseService } from '../services/major_course.service';
import {
  CreateMajorCourseDto,
  MajorCourseResponseDto,
  MajorCourseListResponseDto,
} from '../dtos/major_course.dto';
import { CourseResponseDto } from '../dtos/course.dto';
import { MajorResponseDto } from '../dtos/major.dto';
import { Public } from '../decorators/public.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Role } from '../models/user.schema';

@ApiTags('Major-Courses')
@Controller('major-courses')
export class MajorCourseController {
  constructor(private majorCourseService: MajorCourseService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Lấy tất cả mối quan hệ ngành-môn học' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách mối quan hệ',
    type: [MajorCourseResponseDto],
  })
  async getAll() {
    return this.majorCourseService.getAll();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Lấy mối quan hệ ngành-môn học theo ID' })
  @ApiParam({ name: 'id', description: 'ID mối quan hệ' })
  @ApiResponse({
    status: 200,
    description: 'Thông tin mối quan hệ',
    type: MajorCourseResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  async getById(@Param('id') id: string) {
    return this.majorCourseService.getById(id);
  }

  @Public()
  @Get('major/:majorId/courses')
  @ApiOperation({ summary: 'Lấy danh sách môn học theo ngành' })
  @ApiParam({ name: 'majorId', description: 'ID ngành' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách môn học của ngành',
    type: [CourseResponseDto],
  })
  async getCoursesByMajor(@Param('majorId') majorId: string) {
    return this.majorCourseService.getCoursesByMajor(majorId);
  }

  @Public()
  @Get('course/:courseId/majors')
  @ApiOperation({ summary: 'Lấy danh sách ngành theo môn học' })
  @ApiParam({ name: 'courseId', description: 'ID môn học' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách ngành có môn học này',
    type: [MajorResponseDto],
  })
  async getMajorsByCourse(@Param('courseId') courseId: string) {
    return this.majorCourseService.getMajorsByCourse(courseId);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({
    summary: 'Tạo mối quan hệ ngành-môn học (Chỉ dành cho admin)',
  })
  @ApiResponse({
    status: 201,
    description: 'Mối quan hệ đã được tạo thành công',
    type: MajorCourseResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy ngành học hoặc môn học',
  })
  @ApiResponse({
    status: 409,
    description: 'Mối quan hệ đã tồn tại',
  })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập' })
  async create(@Body() dto: CreateMajorCourseDto) {
    return this.majorCourseService.create(dto.major_id, dto.course_id);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({
    summary: 'Xóa mối quan hệ ngành-môn học (Chỉ dành cho admin)',
  })
  @ApiParam({ name: 'id', description: 'ID mối quan hệ' })
  @ApiResponse({
    status: 200,
    description: 'Mối quan hệ đã được xóa thành công',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Major-Course relationship deleted successfully',
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập' })
  async delete(@Param('id') id: string) {
    return this.majorCourseService.delete(id);
  }

  @Delete('major/:majorId/course/:courseId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({
    summary: 'Xóa mối quan hệ theo ngành và môn học (Chỉ dành cho admin)',
  })
  @ApiParam({ name: 'majorId', description: 'ID ngành' })
  @ApiParam({ name: 'courseId', description: 'ID môn học' })
  @ApiResponse({
    status: 200,
    description: 'Mối quan hệ đã được xóa thành công',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Major-Course relationship deleted successfully',
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập' })
  async deleteByCourseAndMajor(
    @Param('majorId') majorId: string,
    @Param('courseId') courseId: string,
  ) {
    return this.majorCourseService.deleteByCourseAndMajor(majorId, courseId);
  }
}
