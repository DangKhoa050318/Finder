import { Injectable } from '@nestjs/common';
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
      throw new Error('Major not found');
    }
    return major;
  }

  async getByKey(key: string) {
    const major = await this.majorModel.findOne({ key }).exec();
    if (!major) {
      throw new Error('Major not found');
    }
    return major;
  }

  async create(key: string, name: string) {
    const existed = await this.majorModel.findOne({ key }).exec();
    if (existed) {
      throw new Error('Major with this key already exists');
    }
    const major = new this.majorModel({ key, name });
    return major.save();
  }

  async update(id: string, name: string) {
    const major = await this.majorModel.findById(id).exec();
    if (!major) {
      throw new Error('Major not found');
    }
    major.name = name;
    return major.save();
  }

  async delete(id: string) {
    const major = await this.majorModel.findById(id).exec();
    if (!major) {
      throw new Error('Major not found');
    }
    await this.majorModel.findByIdAndDelete(id).exec();
    return { message: 'Major deleted successfully' };
  }
}
