import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Task,
  TaskDocument,
  TaskStatus,
  TaskPriority,
} from '../models/task.schema';

@Injectable()
export class TaskService {
  constructor(
    @InjectModel(Task.name)
    private taskModel: Model<TaskDocument>,
  ) {}

  // Create task
  async createTask(
    userId: string,
    title: string,
    description: string = '',
    dueDate?: Date,
    slotId?: string,
    priority: TaskPriority = TaskPriority.Medium,
  ) {
    const task = new this.taskModel({
      title,
      description,
      created_by: new Types.ObjectId(userId),
      due_date: dueDate || null,
      slot_id: slotId ? new Types.ObjectId(slotId) : null,
      priority,
      status: TaskStatus.Todo,
    });

    return task.save();
  }

  // Update task
  async updateTask(
    taskId: string,
    userId: string,
    updates: {
      title?: string;
      description?: string;
      due_date?: Date | null;
      status?: TaskStatus;
      priority?: TaskPriority;
    },
  ) {
    const task = await this.taskModel.findById(taskId);

    if (!task) {
      throw new NotFoundException('Không tìm thấy task');
    }

    if (task.created_by.toString() !== userId) {
      throw new ForbiddenException('Chỉ người tạo mới có thể chỉnh sửa task');
    }

    Object.assign(task, updates);
    return task.save();
  }

  // Delete task
  async deleteTask(taskId: string, userId: string) {
    const task = await this.taskModel.findById(taskId);

    if (!task) {
      throw new NotFoundException('Không tìm thấy task');
    }

    if (task.created_by.toString() !== userId) {
      throw new ForbiddenException('Chỉ người tạo mới có thể xóa task');
    }

    await this.taskModel.findByIdAndDelete(taskId);

    return { message: 'Đã xóa task thành công' };
  }

  // Get task by ID
  async getTaskById(taskId: string) {
    const task = await this.taskModel
      .findById(taskId)
      .populate('created_by', 'full_name email avatar')
      .populate('slot_id', 'title start_time end_time');

    if (!task) {
      throw new NotFoundException('Không tìm thấy task');
    }

    return task;
  }

  // Get user's tasks
  async getUserTasks(
    userId: string,
    status?: TaskStatus,
    priority?: TaskPriority,
    page: number = 1,
    limit: number = 20,
  ) {
    const skip = (page - 1) * limit;
    const filter: any = { created_by: new Types.ObjectId(userId) };

    if (status) {
      filter.status = status;
    }

    if (priority) {
      filter.priority = priority;
    }

    const [tasks, total] = await Promise.all([
      this.taskModel
        .find(filter)
        .populate('slot_id', 'title start_time')
        .sort({ due_date: 1, created_at: -1 })
        .skip(skip)
        .limit(limit),
      this.taskModel.countDocuments(filter),
    ]);

    return {
      tasks,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Get tasks by slot
  async getTasksBySlot(slotId: string) {
    return this.taskModel
      .find({ slot_id: new Types.ObjectId(slotId) })
      .populate('created_by', 'full_name email avatar')
      .sort({ priority: -1, due_date: 1 });
  }

  // Get overdue tasks
  async getOverdueTasks(userId: string) {
    const now = new Date();

    return this.taskModel
      .find({
        created_by: new Types.ObjectId(userId),
        due_date: { $lt: now },
        status: { $nin: [TaskStatus.Done, TaskStatus.Cancelled] },
      })
      .populate('slot_id', 'title start_time')
      .sort({ due_date: 1 });
  }

  // Get today's tasks
  async getTodayTasks(userId: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    return this.taskModel
      .find({
        created_by: new Types.ObjectId(userId),
        due_date: { $gte: startOfDay, $lte: endOfDay },
        status: { $ne: TaskStatus.Cancelled },
      })
      .populate('slot_id', 'title start_time')
      .sort({ priority: -1 });
  }

  // Get upcoming tasks (next 7 days)
  async getUpcomingTasks(userId: string) {
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);

    return this.taskModel
      .find({
        created_by: new Types.ObjectId(userId),
        due_date: { $gte: now, $lte: nextWeek },
        status: { $nin: [TaskStatus.Done, TaskStatus.Cancelled] },
      })
      .populate('slot_id', 'title start_time')
      .sort({ due_date: 1, priority: -1 });
  }

  // Update task status
  async updateTaskStatus(taskId: string, userId: string, status: TaskStatus) {
    const task = await this.taskModel.findById(taskId);

    if (!task) {
      throw new NotFoundException('Không tìm thấy task');
    }

    if (task.created_by.toString() !== userId) {
      throw new ForbiddenException(
        'Chỉ người tạo mới có thể cập nhật trạng thái task',
      );
    }

    task.status = status;
    return task.save();
  }

  // Get task statistics for user
  async getUserTaskStatistics(userId: string) {
    const tasks = await this.taskModel.find({ created_by: new Types.ObjectId(userId) });

    const stats = {
      total: tasks.length,
      todo: 0,
      inProgress: 0,
      done: 0,
      cancelled: 0,
      overdue: 0,
    };

    const now = new Date();

    tasks.forEach((task) => {
      switch (task.status) {
        case TaskStatus.Todo:
          stats.todo++;
          break;
        case TaskStatus.InProgress:
          stats.inProgress++;
          break;
        case TaskStatus.Done:
          stats.done++;
          break;
        case TaskStatus.Cancelled:
          stats.cancelled++;
          break;
      }

      if (
        task.due_date &&
        task.due_date < now &&
        task.status !== TaskStatus.Done &&
        task.status !== TaskStatus.Cancelled
      ) {
        stats.overdue++;
      }
    });

    return stats;
  }
}
