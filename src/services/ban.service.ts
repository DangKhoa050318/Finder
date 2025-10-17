import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Ban, BanDocument, BanStatus } from '../models/ban.schema';

@Injectable()
export class BanService {
  constructor(
    @InjectModel(Ban.name)
    private banModel: Model<BanDocument>,
  ) {}

  // Ban a user (admin only)
  async banUser(
    userId: string,
    bannedBy: string,
    reason: string,
    until: Date | null = null,
  ) {
    // Check if user already has an active ban
    const activeBan = await this.getActiveBan(userId);
    if (activeBan) {
      throw new BadRequestException('Người dùng đã bị ban');
    }

    const ban = new this.banModel({
      user_id: new Types.ObjectId(userId),
      banned_by: new Types.ObjectId(bannedBy),
      reason,
      until,
      status: BanStatus.Active,
    });

    return ban.save();
  }

  // Update ban (extend/reduce duration, change reason)
  async updateBan(
    banId: string,
    updates: { reason?: string; until?: Date | null; status?: BanStatus },
  ) {
    const ban = await this.banModel.findByIdAndUpdate(
      banId,
      { $set: updates },
      { new: true },
    ).populate('user_id banned_by', 'full_name email');

    if (!ban) {
      throw new NotFoundException('Không tìm thấy lệnh ban');
    }

    return ban;
  }

  // Revoke ban (unban user)
  async revokeBan(banId: string, revokedBy?: string) {
    const ban = await this.banModel.findById(banId);

    if (!ban) {
      throw new NotFoundException('Không tìm thấy lệnh ban');
    }

    if (ban.status !== BanStatus.Active) {
      throw new BadRequestException('Lệnh ban không còn active');
    }

    ban.status = BanStatus.Revoked;
    await ban.save();

    return ban;
  }

  // Get active ban for a user
  async getActiveBan(userId: string): Promise<BanDocument | null> {
    return this.banModel.findOne({
      user_id: userId,
      status: BanStatus.Active,
    });
  }

  // Check if user is banned
  async isUserBanned(userId: string): Promise<boolean> {
    const ban = await this.getActiveBan(userId);
    if (!ban) return false;

    // Check if ban has expired
    if (ban.until && ban.until < new Date()) {
      // Auto-expire the ban
      ban.status = BanStatus.Expired;
      await ban.save();
      return false;
    }

    return true;
  }

  // Get all bans (admin only)
  async getAllBans(
    page: number = 1,
    limit: number = 20,
    status?: BanStatus,
  ) {
    const skip = (page - 1) * limit;
    const filter = status ? { status } : {};

    const [bans, total] = await Promise.all([
      this.banModel
        .find(filter)
        .populate('user_id', 'full_name email')
        .populate('banned_by', 'full_name email')
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit),
      this.banModel.countDocuments(filter),
    ]);

    return {
      bans,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Get ban history for a user
  async getUserBanHistory(userId: string) {
    return this.banModel
      .find({ user_id: userId })
      .populate('banned_by', 'full_name email')
      .sort({ date: -1 });
  }

  // Get ban by ID
  async getBanById(banId: string) {
    const ban = await this.banModel
      .findById(banId)
      .populate('user_id', 'full_name email')
      .populate('banned_by', 'full_name email');

    if (!ban) {
      throw new NotFoundException('Không tìm thấy lệnh ban');
    }

    return ban;
  }

  // Cron job: Expire bans that have passed their until date
  async expireOldBans() {
    const result = await this.banModel.updateMany(
      {
        status: BanStatus.Active,
        until: { $lte: new Date(), $ne: null },
      },
      {
        $set: { status: BanStatus.Expired },
      },
    );

    return {
      message: `Đã hết hạn ${result.modifiedCount} lệnh ban`,
      count: result.modifiedCount,
    };
  }

  // Get ban details with reason (for showing to banned user)
  async getBanDetailsForUser(userId: string) {
    const ban = await this.getActiveBan(userId);
    
    if (!ban) {
      return null;
    }

    // Check and auto-expire if needed
    if (ban.until && ban.until < new Date()) {
      ban.status = BanStatus.Expired;
      await ban.save();
      return null;
    }

    return {
      reason: ban.reason,
      bannedAt: ban.date,
      until: ban.until,
      isPermanent: !ban.until,
    };
  }
}
