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

  async createAdminIfNotExists() {
    const existed = await this.userModel.findOne({
      email: 'admin123@gmail.com',
    });
    if (!existed) {
      const admin = new this.userModel({
        full_name: 'admin',
        email: 'admin123@gmail.com',
        password: '123',
        role: Role.Admin,
      });
      return admin.save();
    }
    return existed;
  }

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
}
