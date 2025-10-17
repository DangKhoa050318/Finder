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
}
