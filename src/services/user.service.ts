import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { Model, Types, isValidObjectId } from 'mongoose';
import { User, UserDocument } from '../models/user.schema';
import { UpdateUserDto } from '../dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async createAdminIfNotExists() {
    const existed = await this.userModel.findOne({
      email: 'admin123@gmail.com',
    });
    if (!existed) {
      const hash = await bcrypt.hash('123', 10); 
      const admin = new this.userModel({
        user_id: 'admin',
        full_name: 'admin',
        email: 'admin123@gmail.com',
        password: hash, 
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

  async findById(id: string) {
    return this.userModel.findById(id).exec();
  }

  async updateById(id: string, patch: UpdateUserDto) {
    const update: any = { ...patch };
    if (patch.major_id !== undefined) {
      if (patch.major_id === null || patch.major_id === '') {
        update.major_id = undefined; // ignore clearing via empty string
      } else {
        if (!isValidObjectId(patch.major_id)) {
          throw new BadRequestException('Invalid major_id');
        }
        update.major_id = new Types.ObjectId(patch.major_id);
      }
    }

    return this.userModel.findByIdAndUpdate(id, update, { new: true }).exec();
  }
}
