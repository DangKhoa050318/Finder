import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Block, BlockDocument } from '../models/block.schema';

@Injectable()
export class BlockService {
  constructor(
    @InjectModel(Block.name)
    private blockModel: Model<BlockDocument>,
  ) {}

  // Block a user
  async blockUser(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) {
      throw new BadRequestException('Không thể chặn chính mình');
    }

    // Check if already blocked
    const existingBlock = await this.blockModel.findOne({
      blocker_id: blockerId,
      blocked_id: blockedId,
    });

    if (existingBlock) {
      throw new BadRequestException('Đã chặn người dùng này rồi');
    }

    const block = new this.blockModel({
      blocker_id: new Types.ObjectId(blockerId),
      blocked_id: new Types.ObjectId(blockedId),
    });

    return block.save();
  }

  // Unblock a user
  async unblockUser(blockerId: string, blockedId: string) {
    const block = await this.blockModel.findOneAndDelete({
      blocker_id: blockerId,
      blocked_id: blockedId,
    });

    if (!block) {
      throw new NotFoundException('Không tìm thấy người dùng trong danh sách chặn');
    }

    return { message: 'Đã bỏ chặn thành công' };
  }

  // Get list of blocked users
  async getBlockedUsers(blockerId: string) {
    return this.blockModel
      .find({ blocker_id: blockerId })
      .populate('blocked_id', 'full_name email')
      .sort({ created_at: -1 });
  }

  // Check if user A has blocked user B
  async isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
    const block = await this.blockModel.findOne({
      blocker_id: blockerId,
      blocked_id: blockedId,
    });

    return !!block;
  }

  // Check if there's any block between two users (either direction)
  async hasBlockBetween(userId1: string, userId2: string): Promise<boolean> {
    const block = await this.blockModel.findOne({
      $or: [
        { blocker_id: userId1, blocked_id: userId2 },
        { blocker_id: userId2, blocked_id: userId1 },
      ],
    });

    return !!block;
  }

  // Get users who blocked this user (admin only, for debugging)
  async getUsersWhoBlockedMe(userId: string) {
    return this.blockModel
      .find({ blocked_id: userId })
      .populate('blocker_id', 'full_name email')
      .sort({ created_at: -1 });
  }
}
