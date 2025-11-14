import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Task,
  TaskDocument,
  TaskStatus,
  TaskPriority,
} from '../models/task.schema';
import {
  TaskAssignment,
  TaskAssignmentDocument,
  AssignmentStatus,
} from '../models/task-assignment.schema';
import { Slot, SlotDocument } from '../models/slot.schema';
import { User, UserDocument } from '../models/user.schema';
import { Notification } from '../models/notification.schema';
import { NotificationGateway } from '../gateways/notification.gateway';

@Injectable()
export class TaskService {
  constructor(
    @InjectModel(Task.name)
    private taskModel: Model<TaskDocument>,
    @InjectModel(TaskAssignment.name)
    private taskAssignmentModel: Model<TaskAssignmentDocument>,
    @InjectModel(Slot.name)
    private slotModel: Model<SlotDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(Notification.name)
    private notificationModel: Model<Notification>,
    @Inject(forwardRef(() => NotificationGateway))
    private notificationGateway: NotificationGateway,
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

  // ==================== PHASE 2: TASK ASSIGNMENT METHODS ====================

  // Create task for slot (Leader/Creator only)
  async createSlotTask(
    userId: string,
    slotId: string,
    title: string,
    description: string = '',
    dueDate?: Date,
    priority: TaskPriority = TaskPriority.Medium,
  ) {
    // Verify slot exists and user is creator
    const slot = await this.slotModel.findById(slotId);
    if (!slot) {
      throw new NotFoundException('Không tìm thấy slot');
    }

    if (slot.created_by.toString() !== userId) {
      throw new ForbiddenException(
        'Chỉ người tạo slot mới có thể tạo task cho slot này',
      );
    }

    const task = new this.taskModel({
      title,
      description,
      created_by: new Types.ObjectId(userId),
      slot_id: new Types.ObjectId(slotId),
      due_date: dueDate || slot.end_time, // Default to slot end time
      priority,
      status: TaskStatus.Todo,
    });

    const savedTask = await task.save();

    // Broadcast new task creation event
    this.notificationGateway.server.emit('taskCreated', {
      taskId: (savedTask._id as Types.ObjectId).toString(),
      slotId: slotId,
      title: savedTask.title,
      description: savedTask.description,
      dueDate: savedTask.due_date,
      priority: savedTask.priority,
      createdBy: userId,
      createdAt: new Date(),
    });

    return savedTask;
  }

  // Get all tasks of a slot
  async getSlotTasks(slotId: string) {
    const tasks = await this.taskModel
      .find({ slot_id: new Types.ObjectId(slotId) })
      .populate('created_by', 'full_name email avatar')
      .sort({ createdAt: -1 });

    // Populate assignments for each task
    const tasksWithAssignments = await Promise.all(
      tasks.map(async (task) => {
        const assignments = await this.taskAssignmentModel
          .find({ task_id: task._id })
          .populate('user_id', 'full_name email avatar')
          .populate('assigned_by', 'full_name email avatar');

        return {
          ...task.toObject(),
          assignments,
        };
      }),
    );

    return tasksWithAssignments;
  }

  // Assign task to user(s)
  async assignTask(
    taskId: string,
    assignerId: string,
    userIds: string[],
  ) {
    const task = await this.taskModel.findById(taskId);
    if (!task) {
      throw new NotFoundException('Không tìm thấy task');
    }

    // Verify assigner is task creator
    if (task.created_by.toString() !== assignerId) {
      throw new ForbiddenException(
        'Chỉ người tạo task mới có thể assign cho người khác',
      );
    }

    const assignments: any[] = [];
    const assigner = await this.userModel.findById(assignerId);

    for (const userId of userIds) {
      // Check if already assigned
      const existing = await this.taskAssignmentModel.findOne({
        task_id: task._id,
        user_id: new Types.ObjectId(userId),
      });

      if (existing) {
        continue; // Skip if already assigned
      }

      // Create assignment
      const assignment = await this.taskAssignmentModel.create({
        task_id: task._id,
        user_id: new Types.ObjectId(userId),
        assigned_by: new Types.ObjectId(assignerId),
        status: AssignmentStatus.Pending,
      });

      assignments.push(assignment);

      // Send notification to assigned user
      try {
        const notification = await this.notificationModel.create({
          user_id: new Types.ObjectId(userId),
          type: 'task_assigned',
          title: 'Task mới được giao',
          description: `${assigner?.full_name || 'Ai đó'} đã giao task "${task.title}" cho bạn`,
          metadata: {
            task_id: (task._id as Types.ObjectId).toString(),
            slot_id: task.slot_id?.toString(),
            assigned_by: assignerId,
            assigned_by_name: assigner?.full_name,
            task_title: task.title,
            due_date: task.due_date?.toISOString(),
          },
          isRead: false,
        });

        // Emit real-time notification
        this.notificationGateway.sendNotificationToUser(userId, {
          _id: notification._id,
          type: notification.type,
          title: notification.title,
          description: notification.description,
          metadata: notification.metadata,
          createdAt: new Date(),
        });
      } catch (error) {
        console.error('Error sending task assignment notification:', error);
      }
    }

    return assignments;
  }

  // Update assignment status (by assigned user)
  async updateAssignmentStatus(
    assignmentId: string,
    userId: string,
    status: AssignmentStatus,
    completionNote?: string,
  ) {
    const assignment = await this.taskAssignmentModel.findById(assignmentId);
    if (!assignment) {
      throw new NotFoundException('Không tìm thấy assignment');
    }

    // Verify user is the assigned person
    if (assignment.user_id.toString() !== userId) {
      throw new ForbiddenException(
        'Bạn không có quyền cập nhật assignment này',
      );
    }

    assignment.status = status;

    if (status === AssignmentStatus.InProgress && !assignment.started_at) {
      assignment.started_at = new Date();
      
      // Emit real-time event for status change to in-progress
      const task = await this.taskModel.findById(assignment.task_id);
      if (task) {
        this.notificationGateway.server.emit('taskStatusUpdated', {
          taskId: (task._id as Types.ObjectId).toString(),
          assignmentId: assignmentId,
          userId: userId,
          status: AssignmentStatus.InProgress,
          startedAt: assignment.started_at,
        });
      }
    }

    if (status === AssignmentStatus.Completed) {
      assignment.completed_at = new Date();
      assignment.completion_note = completionNote || null;

      // Notify task creator
      const task = await this.taskModel.findById(assignment.task_id);
      const user = await this.userModel.findById(userId);

      if (task) {
        try {
          const notification = await this.notificationModel.create({
            user_id: task.created_by,
            type: 'task_completed',
            title: 'Task đã hoàn thành',
            description: `${user?.full_name || 'Ai đó'} đã hoàn thành task "${task.title}"`,
            metadata: {
              task_id: (task._id as Types.ObjectId).toString(),
              slot_id: task.slot_id?.toString(),
              completed_by: userId,
              completed_by_name: user?.full_name,
              completion_note: completionNote,
            },
            isRead: false,
          });

          // Emit real-time notification
          this.notificationGateway.sendNotificationToUser(
            task.created_by.toString(),
            {
              _id: notification._id,
              type: notification.type,
              title: notification.title,
              description: notification.description,
              metadata: notification.metadata,
              createdAt: new Date(),
            },
          );

          // Emit task status update event for real-time UI updates
          this.notificationGateway.server.emit('taskStatusUpdated', {
            taskId: (task._id as Types.ObjectId).toString(),
            assignmentId: assignmentId,
            userId: userId,
            status: AssignmentStatus.Completed,
            completedAt: assignment.completed_at,
            completionNote: completionNote,
          });
        } catch (error) {
          console.error('Error sending task completion notification:', error);
        }
      }
    }

    await assignment.save();
    return assignment;
  }

  // Get user's assigned tasks
  async getUserAssignedTasks(userId: string) {
    const assignments = await this.taskAssignmentModel
      .find({ user_id: new Types.ObjectId(userId) })
      .populate({
        path: 'task_id',
        populate: {
          path: 'created_by',
          select: 'full_name email avatar',
        },
      })
      .populate('assigned_by', 'full_name email avatar')
      .sort({ createdAt: -1 });

    return assignments;
  }

  // Get task assignments
  async getTaskAssignments(taskId: string) {
    return this.taskAssignmentModel
      .find({ task_id: new Types.ObjectId(taskId) })
      .populate('user_id', 'full_name email avatar')
      .populate('assigned_by', 'full_name email avatar')
      .sort({ createdAt: -1 });
  }

  // Unassign user from task
  async unassignTask(taskId: string, userId: string, assignerId: string) {
    const task = await this.taskModel.findById(taskId);
    if (!task) {
      throw new NotFoundException('Không tìm thấy task');
    }

    if (task.created_by.toString() !== assignerId) {
      throw new ForbiddenException(
        'Chỉ người tạo task mới có thể unassign',
      );
    }

    const result = await this.taskAssignmentModel.deleteOne({
      task_id: new Types.ObjectId(taskId),
      user_id: new Types.ObjectId(userId),
    });

    if (result.deletedCount === 0) {
      throw new NotFoundException('Không tìm thấy assignment');
    }

    // Notify unassigned user
    try {
      const assigner = await this.userModel.findById(assignerId);
      const notification = await this.notificationModel.create({
        user_id: new Types.ObjectId(userId),
        type: 'task_unassigned',
        title: 'Đã bị gỡ khỏi task',
        description: `${assigner?.full_name || 'Ai đó'} đã gỡ bạn khỏi task "${task.title}"`,
        metadata: {
          task_id: (task._id as Types.ObjectId).toString(),
          slot_id: task.slot_id?.toString(),
          unassigned_by: assignerId,
          unassigned_by_name: assigner?.full_name,
          task_title: task.title,
        },
        isRead: false,
      });

      // Emit real-time notification
      this.notificationGateway.sendNotificationToUser(userId, {
        _id: notification._id,
        type: notification.type,
        title: notification.title,
        description: notification.description,
        metadata: notification.metadata,
        createdAt: new Date(),
      });

      // Broadcast task unassignment event
      this.notificationGateway.server.emit('taskUnassigned', {
        taskId: (task._id as Types.ObjectId).toString(),
        userId: userId,
        unassignedBy: assignerId,
        unassignedAt: new Date(),
      });
    } catch (error) {
      console.error('Error sending unassignment notification:', error);
    }

    return { success: true };
  }

  // Get task assignment statistics for a slot
  async getSlotTaskStats(slotId: string) {
    const tasks = await this.taskModel.find({
      slot_id: new Types.ObjectId(slotId),
    });

    const taskIds = tasks.map((t) => t._id);

    const assignments = await this.taskAssignmentModel.find({
      task_id: { $in: taskIds },
    });

    return {
      totalTasks: tasks.length,
      totalAssignments: assignments.length,
      pending: assignments.filter((a) => a.status === AssignmentStatus.Pending)
        .length,
      inProgress: assignments.filter(
        (a) => a.status === AssignmentStatus.InProgress,
      ).length,
      completed: assignments.filter(
        (a) => a.status === AssignmentStatus.Completed,
      ).length,
      cancelled: assignments.filter(
        (a) => a.status === AssignmentStatus.Cancelled,
      ).length,
    };
  }
}
