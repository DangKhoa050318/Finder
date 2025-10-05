import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Major, MajorDocument } from '../models/major.schema';

@Injectable()
export class MajorService {
  constructor(@InjectModel(Major.name) private majorModel: Model<MajorDocument>) {}

  async createDefaultMajors() {
    const majors = [
      { major_id: 'se', major_name: 'Software Engineering' },
      { major_id: 'ai', major_name: 'Artificial Intelligence' },
      { major_id: 'ib', major_name: 'International Business' },
    ];

    for (const major of majors) {
      const existed = await this.majorModel.findOne({ major_id: major.major_id });
      if (!existed) {
        await new this.majorModel(major).save();
      }
    }
  }

  async getAll() {
    return this.majorModel.find().exec();
  }
}