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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { TaskService } from '../services/task.service';
import {
  CreateTaskDto,
  UpdateTaskDto,
  TaskResponseDto,
  TaskListResponseDto,
} from '../dtos/task.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { TaskStatus, TaskPriority } from '../models/task.schema';
import { User } from '../decorators/user.decorator';
import type { JwtPayload } from '../types/jwt';

@ApiTags('Tasks')
@ApiBearerAuth()
@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo task' })
  @ApiResponse({
    status: 201,
    description: 'Task được tạo thành công',
    type: TaskResponseDto,
  })
  async createTask(@User() { _id }: JwtPayload, @Body() dto: CreateTaskDto) {
    const dueDate = dto.due_date ? new Date(dto.due_date) : undefined;

    return this.taskService.createTask(
      _id,
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
  @ApiResponse({
    status: 200,
    description: 'Task được cập nhật thành công',
    type: TaskResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Chỉ người tạo mới có thể cập nhật',
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy task' })
  async updateTask(
    @User() { _id }: JwtPayload,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskDto,
  ) {
    const updates: any = { ...dto };
    if (dto.due_date) {
      updates.due_date = new Date(dto.due_date);
    }

    return this.taskService.updateTask(taskId, _id, updates);
  }

  @Delete(':taskId')
  @ApiOperation({ summary: 'Xóa task (Chỉ dành cho người tạo)' })
  @ApiParam({ name: 'taskId', description: 'ID task' })
  @ApiResponse({
    status: 200,
    description: 'Task được xóa thành công',
    type: TaskResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Chỉ người tạo mới có thể xóa' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy task' })
  async deleteTask(
    @User() { _id }: JwtPayload,
    @Param('taskId') taskId: string,
  ) {
    return this.taskService.deleteTask(taskId, _id);
  }

  @Get('my-tasks')
  @ApiOperation({ summary: 'Lấy task của người dùng' })
  @ApiQuery({ name: 'status', required: false, enum: TaskStatus })
  @ApiQuery({ name: 'priority', required: false, enum: TaskPriority })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Danh sách task của người dùng',
    type: TaskListResponseDto,
  })
  async getUserTasks(
    @User() { _id }: JwtPayload,
    @Query('status') status?: TaskStatus,
    @Query('priority') priority?: TaskPriority,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.taskService.getUserTasks(_id, status, priority, page, limit);
  }

  @Get('slot/:slotId')
  @ApiOperation({ summary: 'Lấy task theo slot' })
  @ApiParam({ name: 'slotId', description: 'ID slot' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách task',
    type: TaskListResponseDto,
  })
  async getTasksBySlot(@Param('slotId') slotId: string) {
    return this.taskService.getTasksBySlot(slotId);
  }

  @Get('overdue')
  @ApiOperation({ summary: 'Lấy danh sách task quá hạn' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách task quá hạn',
    type: TaskListResponseDto,
  })
  async getOverdueTasks(@User() { _id }: JwtPayload) {
    return this.taskService.getOverdueTasks(_id);
  }

  @Get('today')
  @ApiOperation({ summary: 'Lấy danh sách task hôm nay' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách task hôm nay',
    type: TaskListResponseDto,
  })
  async getTodayTasks(@User() { _id }: JwtPayload) {
    return this.taskService.getTodayTasks(_id);
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Lấy danh sách task sắp tới (7 ngày tới)' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách task sắp tới',
    type: TaskListResponseDto,
  })
  async getUpcomingTasks(@User() { _id }: JwtPayload) {
    return this.taskService.getUpcomingTasks(_id);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Lấy thống kê task của người dùng' })
  @ApiResponse({
    status: 200,
    description: 'Thống kê task',
    type: TaskListResponseDto,
  })
  async getUserTaskStatistics(@User() { _id }: JwtPayload) {
    return this.taskService.getUserTaskStatistics(_id);
  }

  @Get(':taskId')
  @ApiOperation({ summary: 'Lấy task theo ID' })
  @ApiParam({ name: 'taskId', description: 'ID task' })
  @ApiResponse({
    status: 200,
    description: 'Chi tiết task',
    type: TaskResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy task' })
  async getTaskById(@Param('taskId') taskId: string) {
    return this.taskService.getTaskById(taskId);
  }

  @Put(':taskId/status')
  @ApiOperation({ summary: 'Cập nhật trạng thái task' })
  @ApiParam({ name: 'taskId', description: 'ID task' })
  @ApiResponse({
    status: 200,
    description: 'Đã cập nhật trạng thái task',
    type: TaskResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Chỉ người tạo mới có thể cập nhật',
  })
  async updateTaskStatus(
    @User() { _id }: JwtPayload,
    @Param('taskId') taskId: string,
    @Body('status') status: TaskStatus,
  ) {
    return this.taskService.updateTaskStatus(taskId, _id, status);
  }

  // ==================== PHASE 2: TASK ASSIGNMENT ENDPOINTS ====================

  @Post('slot/:slotId')
  @ApiOperation({ summary: 'Tạo task cho slot (Creator only)' })
  @ApiParam({ name: 'slotId', description: 'ID của slot' })
  @ApiResponse({
    status: 201,
    description: 'Task đã được tạo cho slot',
    type: TaskResponseDto,
  })
  async createSlotTask(
    @User() { _id }: JwtPayload,
    @Param('slotId') slotId: string,
    @Body() dto: CreateTaskDto,
  ) {
    const dueDate = dto.due_date ? new Date(dto.due_date) : undefined;
    return this.taskService.createSlotTask(
      _id,
      slotId,
      dto.title,
      dto.description,
      dueDate,
      dto.priority,
    );
  }

  @Get('slot/:slotId')
  @ApiOperation({ summary: 'Lấy tất cả tasks của slot' })
  @ApiParam({ name: 'slotId', description: 'ID của slot' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách tasks của slot',
    type: TaskListResponseDto,
  })
  async getSlotTasks(@Param('slotId') slotId: string) {
    return this.taskService.getSlotTasks(slotId);
  }

  @Post(':taskId/assign')
  @ApiOperation({ summary: 'Assign task cho user(s)' })
  @ApiParam({ name: 'taskId', description: 'ID của task' })
  @ApiResponse({
    status: 200,
    description: 'Task đã được assign',
  })
  async assignTask(
    @User() { _id }: JwtPayload,
    @Param('taskId') taskId: string,
    @Body('userIds') userIds: string[],
  ) {
    return this.taskService.assignTask(taskId, _id, userIds);
  }

  @Get(':taskId/assignments')
  @ApiOperation({ summary: 'Lấy danh sách assignments của task' })
  @ApiParam({ name: 'taskId', description: 'ID của task' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách assignments',
  })
  async getTaskAssignments(@Param('taskId') taskId: string) {
    return this.taskService.getTaskAssignments(taskId);
  }

  @Delete(':taskId/assign/:userId')
  @ApiOperation({ summary: 'Unassign user khỏi task' })
  @ApiParam({ name: 'taskId', description: 'ID của task' })
  @ApiParam({ name: 'userId', description: 'ID của user cần unassign' })
  @ApiResponse({
    status: 200,
    description: 'Đã unassign user',
  })
  async unassignTask(
    @User() { _id }: JwtPayload,
    @Param('taskId') taskId: string,
    @Param('userId') userId: string,
  ) {
    return this.taskService.unassignTask(taskId, userId, _id);
  }

  @Get('my-assignments')
  @ApiOperation({ summary: 'Lấy danh sách tasks được assign cho user' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách assignments của user',
  })
  async getUserAssignedTasks(@User() { _id }: JwtPayload) {
    return this.taskService.getUserAssignedTasks(_id);
  }

  @Put('assignments/:assignmentId/status')
  @ApiOperation({ summary: 'Cập nhật trạng thái assignment' })
  @ApiParam({ name: 'assignmentId', description: 'ID của assignment' })
  @ApiResponse({
    status: 200,
    description: 'Đã cập nhật trạng thái assignment',
  })
  async updateAssignmentStatus(
    @User() { _id }: JwtPayload,
    @Param('assignmentId') assignmentId: string,
    @Body('status') status: string,
    @Body('completionNote') completionNote?: string,
  ) {
    return this.taskService.updateAssignmentStatus(
      assignmentId,
      _id,
      status as any,
      completionNote,
    );
  }

  @Get('slot/:slotId/stats')
  @ApiOperation({ summary: 'Lấy thống kê task assignments của slot' })
  @ApiParam({ name: 'slotId', description: 'ID của slot' })
  @ApiResponse({
    status: 200,
    description: 'Thống kê task assignments',
  })
  async getSlotTaskStats(@Param('slotId') slotId: string) {
    return this.taskService.getSlotTaskStats(slotId);
  }
}
