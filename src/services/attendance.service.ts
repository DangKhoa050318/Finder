import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Attendance,
  AttendanceDocument,
  AttendanceStatus,
} from '../models/attendance.schema';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectModel(Attendance.name)
    private attendanceModel: Model<AttendanceDocument>,
  ) {}

  // Register for a slot
  async registerForSlot(userId: string, slotId: string) {
    const userObjectId = new Types.ObjectId(userId);
    const slotObjectId = new Types.ObjectId(slotId);

    // Check if already registered
    const existing = await this.attendanceModel.findOne({
      user_id: userObjectId,
      slot_id: slotObjectId,
    });

    if (existing) {
      throw new BadRequestException('Đã đăng ký slot này rồi');
    }

    const attendance = new this.attendanceModel({
      user_id: userObjectId,
      slot_id: slotObjectId,
      status: AttendanceStatus.Registered,
    });

    return attendance.save();
  }

  // Mark attendance - start attending
  async startAttending(userId: string, slotId: string) {
    const userObjectId = new Types.ObjectId(userId);
    const slotObjectId = new Types.ObjectId(slotId);

    const attendance = await this.attendanceModel.findOne({
      user_id: userObjectId,
      slot_id: slotObjectId,
    });

    if (!attendance) {
      throw new NotFoundException('Chưa đăng ký slot này');
    }

    if (attendance.status === AttendanceStatus.Attending) {
      throw new BadRequestException('Đã bắt đầu tham gia rồi');
    }

    attendance.status = AttendanceStatus.Attending;
    attendance.started_at = new Date();

    return attendance.save();
  }

  // Mark as completed
  async completeAttendance(userId: string, slotId: string) {
    const userObjectId = new Types.ObjectId(userId);
    const slotObjectId = new Types.ObjectId(slotId);

    const attendance = await this.attendanceModel.findOne({
      user_id: userObjectId,
      slot_id: slotObjectId,
    });

    if (!attendance) {
      throw new NotFoundException('Chưa đăng ký slot này');
    }

    if (attendance.status !== AttendanceStatus.Attending) {
      throw new BadRequestException(
        'Phải bắt đầu tham gia trước khi hoàn thành',
      );
    }

    attendance.status = AttendanceStatus.Completed;
    attendance.left_at = new Date();

    return attendance.save();
  }

  // Mark as absent
  async markAbsent(userId: string, slotId: string) {
    const userObjectId = new Types.ObjectId(userId);
    const slotObjectId = new Types.ObjectId(slotId);

    const attendance = await this.attendanceModel.findOne({
      user_id: userObjectId,
      slot_id: slotObjectId,
    });

    if (!attendance) {
      throw new NotFoundException('Chưa đăng ký slot này');
    }

    attendance.status = AttendanceStatus.Absent;

    return attendance.save();
  }

  // Cancel registration
  async cancelRegistration(userId: string, slotId: string) {
    const userObjectId = new Types.ObjectId(userId);
    const slotObjectId = new Types.ObjectId(slotId);

    const result = await this.attendanceModel.findOneAndDelete({
      user_id: userObjectId,
      slot_id: slotObjectId,
      status: AttendanceStatus.Registered,
    });

    if (!result) {
      throw new NotFoundException(
        'Không tìm thấy đăng ký hoặc đã bắt đầu tham gia',
      );
    }

    return { message: 'Đã hủy đăng ký thành công' };
  }

  // Get user's attendances
  async getUserAttendances(
    userId: string,
    status?: AttendanceStatus,
    page: number = 1,
    limit: number = 20,
  ) {
    const skip = (page - 1) * limit;
    const userObjectId = new Types.ObjectId(userId);
    const filter: any = { user_id: userObjectId };

    if (status) {
      filter.status = status;
    }

    const [attendances, total] = await Promise.all([
      this.attendanceModel
        .find(filter)
        .populate('slot_id')
        .sort({ started_at: -1 })
        .skip(skip)
        .limit(limit),
      this.attendanceModel.countDocuments(filter),
    ]);

    return {
      attendances,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Get slot attendees
  async getSlotAttendees(slotId: string, status?: AttendanceStatus) {
    const slotObjectId = new Types.ObjectId(slotId);
    const filter: any = { slot_id: slotObjectId };

    if (status) {
      filter.status = status;
    }

    return this.attendanceModel
      .find(filter)
      .populate('user_id', 'full_name email avatar')
      .sort({ started_at: 1 });
  }

  // Get attendance statistics for a slot
  async getSlotStatistics(slotId: string) {
    const slotObjectId = new Types.ObjectId(slotId);
    const attendances = await this.attendanceModel.find({
      slot_id: slotObjectId,
    });

    const stats = {
      total: attendances.length,
      registered: 0,
      attending: 0,
      completed: 0,
      absent: 0,
    };

    attendances.forEach((a) => {
      switch (a.status) {
        case AttendanceStatus.Registered:
          stats.registered++;
          break;
        case AttendanceStatus.Attending:
          stats.attending++;
          break;
        case AttendanceStatus.Completed:
          stats.completed++;
          break;
        case AttendanceStatus.Absent:
          stats.absent++;
          break;
      }
    });

    return stats;
  }

  // Check if user is registered for slot
  async isRegistered(userId: string, slotId: string): Promise<boolean> {
    const userObjectId = new Types.ObjectId(userId);
    const slotObjectId = new Types.ObjectId(slotId);

    const attendance = await this.attendanceModel.findOne({
      user_id: userObjectId,
      slot_id: slotObjectId,
    });
    return !!attendance;
  }

  // Get user's attendance for specific slot
  async getUserSlotAttendance(userId: string, slotId: string) {
    const userObjectId = new Types.ObjectId(userId);
    const slotObjectId = new Types.ObjectId(slotId);

    return this.attendanceModel.findOne({
      user_id: userObjectId,
      slot_id: slotObjectId,
    });
  }
}
