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
import { NewsService } from '../services/news.service';
import { CreateNewsDto, UpdateNewsDto } from '../dtos/news.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Role } from '../models/user.schema';

@ApiTags('News')
@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Tạo tin tức (Chỉ dành cho admin)' })
  @ApiResponse({ status: 201, description: 'Tin tức đã được tạo thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập' })
  async createNews(@User() { _id }: JwtPayload, @Body() dto: CreateNewsDto) {
    return this.newsService.createNews(_id, dto.title, dto.content);
  }

  @Put(':newsId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Cập nhật tin tức (Chỉ dành cho admin)' })
  @ApiParam({ name: 'newsId', description: 'ID tin tức' })
  @ApiResponse({
    status: 200,
    description: 'Tin tức đã được cập nhật thành công',
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy tin tức' })
  async updateNews(
    @Param('newsId') newsId: string,
    @Body() dto: UpdateNewsDto,
  ) {
    return this.newsService.updateNews(newsId, dto);
  }

  @Delete(':newsId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Xóa tin tức (Chỉ dành cho admin)' })
  @ApiParam({ name: 'newsId', description: 'ID tin tức' })
  @ApiResponse({ status: 200, description: 'Tin tức đã bị xóa' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy tin tức' })
  async deleteNews(@Param('newsId') newsId: string) {
    return this.newsService.deleteNews(newsId);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy tất cả tin tức với phân trang' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({ status: 200, description: 'Danh sách tin tức' })
  async getAllNews(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.newsService.getAllNews(page, limit);
  }

  @Get('latest')
  @ApiOperation({ summary: 'Lấy tin tức mới nhất (dành cho trang chủ)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 5 })
  @ApiResponse({ status: 200, description: 'Tin tức mới nhất' })
  async getLatestNews(@Query('limit') limit?: number) {
    return this.newsService.getLatestNews(limit);
  }

  @Get('search')
  @ApiOperation({ summary: 'Tìm kiếm tin tức theo tiêu đề hoặc nội dung' })
  @ApiQuery({ name: 'q', required: true, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Kết quả tìm kiếm' })
  async searchNews(
    @Query('q') query: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.newsService.searchNews(query, page, limit);
  }

  @Get(':newsId')
  @ApiOperation({ summary: 'Lấy tin tức theo ID' })
  @ApiParam({ name: 'newsId', description: 'ID tin tức' })
  @ApiResponse({ status: 200, description: 'Chi tiết tin tức' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy tin tức' })
  async getNewsById(@Param('newsId') newsId: string) {
    return this.newsService.getNewsById(newsId);
  }
}
