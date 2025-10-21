import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { Model } from 'mongoose';
import { Role, User, UserDocument } from '../models/user.schema';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(data: Partial<User>) {
    const user = new this.userModel(data);
    return user.save();
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({ email });
  }

  async findById(id: string) {
    return this.userModel.findById(id);
  }

  async findByIdWithPopulate(id: string) {
    return this.userModel.findById(id).populate('major_id');
  }

  async updateUserStatus(
    userId: string,
    status: { isNewUser?: boolean; isBlocked?: boolean },
  ) {
    return this.userModel.findByIdAndUpdate(
      userId,
      { $set: { status } },
      { new: true },
    );
  }

  async updateUser(userId: string, data: Partial<User>) {
    const user = await this.userModel.findById(userId);
    if (!user) return null;
    user.set(data);
    return user.save();
  }

  async changePassword(userId: string, newPassword: string) {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('Người dùng không tồn tại');

    user.password = newPassword;
    return user.save();
  }

  async searchUsers(options: {
    query?: string;
    isBlocked?: boolean;
    major_id?: string;
    limit?: number;
    page?: number;
  }) {
    const { query, isBlocked, major_id, limit = 20, page = 1 } = options;

    const filter: any = {};

    // Search by name or email
    if (query) {
      filter.$or = [
        { full_name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
      ];
    }

    // Filter by blocked status
    if (isBlocked !== undefined) {
      filter['status.isBlocked'] = isBlocked;
    }

    // Filter by major
    if (major_id) {
      filter.major_id = major_id;
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.userModel
        .find(filter)
        .select('full_name email avatar major_id status')
        .populate('major_id', 'name')
        .limit(limit)
        .skip(skip)
        .lean(),
      this.userModel.countDocuments(filter),
    ]);

    return {
      users: users.map((user) => ({
        _id: user._id,
        full_name: user.full_name,
        email: user.email,
        avatar: user.avatar,
        major_id: user.major_id,
        isBlocked: (user as any).status?.isBlocked || false,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
