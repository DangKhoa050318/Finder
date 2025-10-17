import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Reminder, ReminderDocument, ReminderMethod, ReminderStatus } from '../models/reminder.schema';

@Injectable()
export class ReminderService {
  constructor(
    @InjectModel(Reminder.name)
    private reminderModel: Model<ReminderDocument>,
  ) {}

  // Create reminder (auto when user registers for slot or manual)
  async createReminder(
    slotId: string,
    userId: string,
    remindAt: Date,
    method: ReminderMethod = ReminderMethod.InApp,
    customMessage?: string,
  ) {
    if (remindAt <= new Date()) {
      throw new BadRequestException('Thời gian nhắc nhở phải ở tương lai');
    }

    // Check for duplicate
    const existing = await this.reminderModel.findOne({
      slot_id: slotId,
      user_id: userId,
      remind_at: remindAt,
      status: ReminderStatus.Pending,
    });

    if (existing) {
      throw new BadRequestException('Đã có nhắc nhở tại thời gian này');
    }

    const reminder = new this.reminderModel({
      slot_id: new Types.ObjectId(slotId),
      user_id: new Types.ObjectId(userId),
      remind_at: remindAt,
      method,
      message: customMessage || 'Slot sắp bắt đầu!',
      status: ReminderStatus.Pending,
    });

    return reminder.save();
  }

  // Auto create reminder when registering for slot (15 minutes before)
  async autoCreateReminder(slotId: string, userId: string, slotStartTime: Date) {
    const remindTime = new Date(slotStartTime.getTime() - 15 * 60 * 1000); // 15 minutes before

    // Only create if slot is in future
    if (remindTime > new Date()) {
      return this.createReminder(
        slotId,
        userId,
        remindTime,
        ReminderMethod.InApp,
        'Slot học sắp bắt đầu trong 15 phút!',
      );
    }

    return null;
  }

  // Update reminder
  async updateReminder(
    reminderId: string,
    userId: string,
    updates: {
      remind_at?: Date;
      method?: ReminderMethod;
      message?: string;
    },
  ) {
    const reminder = await this.reminderModel.findById(reminderId);

    if (!reminder) {
      throw new NotFoundException('Không tìm thấy nhắc nhở');
    }

    if (reminder.user_id.toString() !== userId) {
      throw new BadRequestException('Không có quyền chỉnh sửa nhắc nhở này');
    }

    if (reminder.status !== ReminderStatus.Pending) {
      throw new BadRequestException('Không thể chỉnh sửa nhắc nhở đã gửi hoặc thất bại');
    }

    if (updates.remind_at && updates.remind_at <= new Date()) {
      throw new BadRequestException('Thời gian nhắc nhở phải ở tương lai');
    }

    Object.assign(reminder, updates);
    return reminder.save();
  }

  // Delete reminder
  async deleteReminder(reminderId: string, userId: string) {
    const reminder = await this.reminderModel.findById(reminderId);

    if (!reminder) {
      throw new NotFoundException('Không tìm thấy nhắc nhở');
    }

    if (reminder.user_id.toString() !== userId) {
      throw new BadRequestException('Không có quyền xóa nhắc nhở này');
    }

    if (reminder.status !== ReminderStatus.Pending) {
      throw new BadRequestException('Không thể xóa nhắc nhở đã gửi hoặc thất bại');
    }

    await this.reminderModel.findByIdAndDelete(reminderId);

    return { message: 'Đã xóa nhắc nhở thành công' };
  }

  // Get pending reminders to send (for cron job)
  async getPendingReminders() {
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    return this.reminderModel
      .find({
        status: ReminderStatus.Pending,
        remind_at: { $gte: now, $lte: fiveMinutesFromNow },
      })
      .populate('slot_id', 'title start_time end_time')
      .populate('user_id', 'full_name email');
  }

  // Mark reminder as sent
  async markAsSent(reminderId: string) {
    const reminder = await this.reminderModel.findById(reminderId);

    if (!reminder) {
      throw new NotFoundException('Không tìm thấy nhắc nhở');
    }

    reminder.status = ReminderStatus.Sent;
    return reminder.save();
  }

  // Mark reminder as failed
  async markAsFailed(reminderId: string) {
    const reminder = await this.reminderModel.findById(reminderId);

    if (!reminder) {
      throw new NotFoundException('Không tìm thấy nhắc nhở');
    }

    reminder.status = ReminderStatus.Failed;
    return reminder.save();
  }

  // Get user's reminders
  async getUserReminders(
    userId: string,
    status?: ReminderStatus,
    page: number = 1,
    limit: number = 20,
  ) {
    const skip = (page - 1) * limit;
    const filter: any = { user_id: userId };

    if (status) {
      filter.status = status;
    }

    const [reminders, total] = await Promise.all([
      this.reminderModel
        .find(filter)
        .populate('slot_id', 'title start_time end_time')
        .sort({ remind_at: -1 })
        .skip(skip)
        .limit(limit),
      this.reminderModel.countDocuments(filter),
    ]);

    return {
      reminders,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Get reminders for a slot
  async getSlotReminders(slotId: string) {
    return this.reminderModel
      .find({ slot_id: slotId })
      .populate('user_id', 'full_name email')
      .sort({ remind_at: 1 });
  }

  // Send reminders (to be called by cron job every minute)
  async sendDueReminders() {
    const reminders = await this.getPendingReminders();

    const results = {
      total: reminders.length,
      sent: 0,
      failed: 0,
    };

    for (const reminder of reminders) {
      try {
        // TODO: Implement actual sending logic (email, push notification, etc.)
        // For now, just mark as sent
        await this.markAsSent((reminder._id as any).toString());
        results.sent++;
      } catch (error) {
        await this.markAsFailed((reminder._id as any).toString());
        results.failed++;
      }
    }

    return results;
  }

  // Cancel all reminders for a slot (when slot is deleted)
  async cancelSlotReminders(slotId: string) {
    await this.reminderModel.deleteMany({
      slot_id: slotId,
      status: ReminderStatus.Pending,
    });
  }
}
