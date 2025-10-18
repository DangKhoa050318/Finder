import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Major, MajorDocument } from '../models/major.schema';

@Injectable()
export class MajorService {
  constructor(
    @InjectModel(Major.name) private majorModel: Model<MajorDocument>,
  ) {}

  async createDefaultMajors() {
    const majors = [
      { key: 'se', name: 'Software Engineering' },
      { key: 'ai', name: 'Artificial Intelligence' },
      { key: 'ib', name: 'International Business' },
    ];

    for (const major of majors) {
      const existed = await this.majorModel.findOne({
        key: major.key,
      });
      if (!existed) {
        await new this.majorModel(major).save();
      }
    }
  }

  async getAll() {
    return this.majorModel.find().exec();
  }

  async getById(id: string) {
    const major = await this.majorModel.findById(id).exec();
    if (!major) {
      throw new NotFoundException('Không tìm thấy ngành học');
    }
    return major;
  }

  async getByKey(key: string) {
    const major = await this.majorModel.findOne({ key }).exec();
    if (!major) {
      throw new NotFoundException('Không tìm thấy ngành học');
    }
    return major;
  }

  async create(key: string, name: string) {
    const existed = await this.majorModel.findOne({ key }).exec();
    if (existed) {
      throw new ConflictException('Mã ngành đã tồn tại');
    }
    const major = new this.majorModel({ key, name });
    return major.save();
  }

  async update(id: string, name: string) {
    const major = await this.majorModel.findById(id).exec();
    if (!major) {
      throw new NotFoundException('Không tìm thấy ngành học');
    }
    major.name = name;
    return major.save();
  }

  async delete(id: string) {
    const major = await this.majorModel.findById(id).exec();
    if (!major) {
      throw new NotFoundException('Không tìm thấy ngành học');
    }
    await this.majorModel.findByIdAndDelete(id).exec();
    return { message: 'Đã xóa ngành học thành công' };
  }
}
