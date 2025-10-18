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
import { TaskService } from '../services/task.service';
import { CreateTaskDto, UpdateTaskDto } from '../dtos/task.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { TaskStatus, TaskPriority } from '../models/task.schema';

@ApiTags('Tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo task' })
  @ApiResponse({ status: 201, description: 'Task được tạo thành công' })
  async createTask(
    @Request() req,
    @Body() dto: CreateTaskDto,
  ) {
    const dueDate = dto.due_date ? new Date(dto.due_date) : undefined;

    return this.taskService.createTask(
      req.user.id,
      dto.title,
      dto.description || '',
      dueDate,
      dto.slot_id,
      dto.priority,
    );
  }

  @Put(':taskId')
  @ApiOperation({ summary: 'Cập nhật task (Chỉ dành cho người tạo)' })
  @ApiParam({ name: 'taskId', description: 'ID task' })
  @ApiResponse({ status: 200, description: 'Task được cập nhật thành công' })
  @ApiResponse({ status: 403, description: 'Chỉ người tạo mới có thể cập nhật' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy task' })
  async updateTask(
    @Request() req,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskDto,
  ) {
    const updates: any = { ...dto };
    if (dto.due_date) {
      updates.due_date = new Date(dto.due_date);
    }

    return this.taskService.updateTask(taskId, req.user.id, updates);
  }

  @Delete(':taskId')
  @ApiOperation({ summary: 'Xóa task (Chỉ dành cho người tạo)' })
  @ApiParam({ name: 'taskId', description: 'ID task' })
  @ApiResponse({ status: 200, description: 'Task được xóa thành công' })
  @ApiResponse({ status: 403, description: 'Chỉ người tạo mới có thể xóa' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy task' })
  async deleteTask(
    @Request() req,
    @Param('taskId') taskId: string,
  ) {
    return this.taskService.deleteTask(taskId, req.user.id);
  }

  @Get('my-tasks')
  @ApiOperation({ summary: 'Lấy task của người dùng' })
  @ApiQuery({ name: 'status', required: false, enum: TaskStatus })
  @ApiQuery({ name: 'priority', required: false, enum: TaskPriority })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Danh sách task của người dùng' })
  async getUserTasks(
    @Request() req,
    @Query('status') status?: TaskStatus,
    @Query('priority') priority?: TaskPriority,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.taskService.getUserTasks(req.user.id, status, priority, page, limit);
  }

  @Get('slot/:slotId')
  @ApiOperation({ summary: 'Lấy task theo slot' })
  @ApiParam({ name: 'slotId', description: 'ID slot' })
  @ApiResponse({ status: 200, description: 'Danh sách task' })
  async getTasksBySlot(@Param('slotId') slotId: string) {
    return this.taskService.getTasksBySlot(slotId);
  }

  @Get('overdue')
  @ApiOperation({ summary: 'Lấy danh sách task quá hạn' })
  @ApiResponse({ status: 200, description: 'Danh sách task quá hạn' })
  async getOverdueTasks(@Request() req) {
    return this.taskService.getOverdueTasks(req.user.id);
  }

  @Get('today')
  @ApiOperation({ summary: 'Lấy danh sách task hôm nay' })
  @ApiResponse({ status: 200, description: 'Danh sách task hôm nay' })
  async getTodayTasks(@Request() req) {
    return this.taskService.getTodayTasks(req.user.id);
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Lấy danh sách task sắp tới (7 ngày tới)' })
  @ApiResponse({ status: 200, description: 'Danh sách task sắp tới' })
  async getUpcomingTasks(@Request() req) {
    return this.taskService.getUpcomingTasks(req.user.id);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Lấy thống kê task của người dùng' })
  @ApiResponse({ status: 200, description: 'Thống kê task' })
  async getUserTaskStatistics(@Request() req) {
    return this.taskService.getUserTaskStatistics(req.user.id);
  }

  @Get(':taskId')
  @ApiOperation({ summary: 'Lấy task theo ID' })
  @ApiParam({ name: 'taskId', description: 'ID task' })
  @ApiResponse({ status: 200, description: 'Chi tiết task' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy task' })
  async getTaskById(@Param('taskId') taskId: string) {
    return this.taskService.getTaskById(taskId);
  }

  @Put(':taskId/status')
  @ApiOperation({ summary: 'Cập nhật trạng thái task' })
  @ApiParam({ name: 'taskId', description: 'ID task' })
  @ApiResponse({ status: 200, description: 'Đã cập nhật trạng thái task' })
  @ApiResponse({ status: 403, description: 'Chỉ người tạo mới có thể cập nhật' })
  async updateTaskStatus(
    @Request() req,
    @Param('taskId') taskId: string,
    @Body('status') status: TaskStatus,
  ) {
    return this.taskService.updateTaskStatus(taskId, req.user.id, status);
  }
}
