import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Availability, AvailabilityDocument } from '../models/availability.schema';

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectModel(Availability.name)
    private availabilityModel: Model<AvailabilityDocument>,
  ) {}

  async create(input: {
    user_id: string | Types.ObjectId;
    day_of_week: number;
    start_time: string;
    end_time: string;
  }) {
    const userId = typeof input.user_id === 'string' ? new Types.ObjectId(input.user_id) : input.user_id;
    // basic validation: start < end
    if (!(this.isValidTime(input.start_time) && this.isValidTime(input.end_time))) {
      throw new BadRequestException('Thời gian không hợp lệ (HH:mm)');
    }
    if (input.start_time >= input.end_time) {
      throw new BadRequestException('Thời gian không hợp lệ (HH:mm)');
    }

    // naive overlap check within same day for same user
    const overlap = await this.availabilityModel.findOne({
      user_id: userId,
      day_of_week: input.day_of_week,
      $or: [
        { $and: [{ start_time: { $lt: input.end_time } }, { end_time: { $gt: input.start_time } }] },
      ],
    });
    if (overlap) {
      throw new BadRequestException('Khoảng thời gian bị chồng lấp');
    }

    const doc = new this.availabilityModel({
      user_id: userId,
      day_of_week: input.day_of_week,
      start_time: input.start_time,
      end_time: input.end_time,
    });
    return doc.save();
  }

  async listByUser(user_id: string | Types.ObjectId) {
    const uid = typeof user_id === 'string' ? new Types.ObjectId(user_id) : user_id;
    return this.availabilityModel.find({ user_id: uid }).sort({ day_of_week: 1, start_time: 1 }).exec();
  }

  async update(id: string, patch: Partial<Pick<Availability, 'day_of_week' | 'start_time' | 'end_time'>>) {
    const doc = await this.availabilityModel.findById(id);
    if (!doc) throw new NotFoundException('Availability không tồn tại');
    const next = { ...doc.toObject(), ...patch } as Availability;
    if (!(this.isValidTime(next.start_time) && this.isValidTime(next.end_time))) {
      throw new BadRequestException('Thời gian không hợp lệ (HH:mm)');
    }
    if (next.start_time >= next.end_time) {
      throw new BadRequestException('Thời gian không hợp lệ (HH:mm)');
    }
    // overlap check (excluding current id)
    const overlap = await this.availabilityModel.findOne({
      _id: { $ne: doc._id },
      user_id: doc.user_id,
      day_of_week: next.day_of_week,
      $or: [
        { $and: [{ start_time: { $lt: next.end_time } }, { end_time: { $gt: next.start_time } }] },
      ],
    });
    if (overlap) throw new BadRequestException('Khoảng thời gian bị chồng lấp');
    doc.set(next);
    return doc.save();
  }

  async remove(id: string) {
    const res = await this.availabilityModel.findByIdAndDelete(id);
    if (!res) throw new NotFoundException('Availability không tồn tại');
    return { success: true };
  }

  private isValidTime(t: string) {
    return /^([0-1]\d|2[0-3]):([0-5]\d)$/.test(t);
  }
}
