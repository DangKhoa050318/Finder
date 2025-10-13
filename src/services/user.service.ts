import { Injectable } from '@nestjs/common';
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
}
