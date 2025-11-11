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
import { GroupDocumentService } from '../services/group-document.service';
import {
  CreateGroupDocumentDto,
  UpdateGroupDocumentDto,
  GetGroupDocumentsQueryDto,
} from '../dtos/group-document.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('Group Documents')
@Controller()
@UseGuards(JwtAuthGuard)
export class GroupDocumentController {
  constructor(
    private readonly groupDocumentService: GroupDocumentService,
  ) {}

  @Post('groups/:groupId/documents')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo tài liệu mới cho nhóm (Chỉ leader)' })
  @ApiParam({ name: 'groupId', description: 'ID nhóm' })
  @ApiResponse({ status: 201, description: 'Tài liệu đã được tạo thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy nhóm' })
  async createDocument(
    @Param('groupId') groupId: string,
    @User() { _id }: JwtPayload,
    @Body() dto: CreateGroupDocumentDto,
  ) {
    dto.user_id = _id;
    return this.groupDocumentService.createDocument(groupId, dto);
  }

  @Get('groups/:groupId/documents')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy tất cả tài liệu của nhóm' })
  @ApiParam({ name: 'groupId', description: 'ID nhóm' })
  @ApiQuery({ name: 'page', required: false, description: 'Số trang' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Số tài liệu mỗi trang',
  })
  @ApiResponse({ status: 200, description: 'Danh sách tài liệu' })
  async getDocuments(
    @Param('groupId') groupId: string,
    @Query() query: GetGroupDocumentsQueryDto,
  ) {
    return this.groupDocumentService.getDocuments(groupId, query);
  }

  @Get('documents/:documentId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy chi tiết một tài liệu' })
  @ApiParam({ name: 'documentId', description: 'ID tài liệu' })
  @ApiResponse({ status: 200, description: 'Chi tiết tài liệu' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy tài liệu' })
  async getDocumentById(@Param('documentId') documentId: string) {
    return this.groupDocumentService.getDocumentById(documentId);
  }

  @Put('documents/:documentId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật tài liệu (Chỉ leader)' })
  @ApiParam({ name: 'documentId', description: 'ID tài liệu' })
  @ApiResponse({ status: 200, description: 'Tài liệu đã được cập nhật' })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy tài liệu' })
  async updateDocument(
    @Param('documentId') documentId: string,
    @User() { _id }: JwtPayload,
    @Body() dto: UpdateGroupDocumentDto,
  ) {
    dto.user_id = _id;
    return this.groupDocumentService.updateDocument(documentId, dto);
  }

  @Delete('documents/:documentId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa tài liệu (Chỉ leader)' })
  @ApiParam({ name: 'documentId', description: 'ID tài liệu' })
  @ApiResponse({ status: 200, description: 'Tài liệu đã bị xóa' })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy tài liệu' })
  async deleteDocument(
    @Param('documentId') documentId: string,
    @User() { _id }: JwtPayload,
  ) {
    return this.groupDocumentService.deleteDocument(documentId, _id);
  }
}
