import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../models/user.schema';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async createAdminIfNotExists() {
    const existed = await this.userModel.findOne({ email: 'admin123@gmail.com' });
    if (!existed) {
      const hash = await bcrypt.hash('123', 10); // Mã hóa mật khẩu
      const admin = new this.userModel({
        user_id: 'admin',
        full_name: 'admin',
        email: 'admin123@gmail.com',
        password: hash, // Lưu mật khẩu đã mã hóa
        role: 'Admin',
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
}