import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Report, ReportDocument } from '../models/report.schema';

@Injectable()
export class ReportService {
  constructor(
    @InjectModel(Report.name)
    private reportModel: Model<ReportDocument>,
  ) {}

  // Create a report
  async createReport(reporterId: string, reportedId: string, reason: string) {
    const report = new this.reportModel({
      reporter_id: new Types.ObjectId(reporterId),
      reported_id: new Types.ObjectId(reportedId),
      reason,
    });

    return report.save();
  }

  // Get all reports (admin only)
  async getAllReports(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      this.reportModel
        .find()
        .populate('reporter_id', 'full_name email avatar')
        .populate('reported_id', 'full_name email avatar')
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit),
      this.reportModel.countDocuments(),
    ]);

    return {
      reports,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Get reports for a specific user (admin only)
  async getReportsByReportedUser(reportedId: string) {
    return this.reportModel
      .find({ reported_id: reportedId })
      .populate('reporter_id', 'full_name email avatar')
      .sort({ date: -1 });
  }

  // Get reports made by a user
  async getReportsByReporter(reporterId: string) {
    return this.reportModel
      .find({ reporter_id: reporterId })
      .populate('reported_id', 'full_name email avatar')
      .sort({ date: -1 });
  }

  // Get report by ID
  async getReportById(reportId: string) {
    const report = await this.reportModel
      .findById(reportId)
      .populate('reporter_id', 'full_name email avatar')
      .populate('reported_id', 'full_name email avatar');

    if (!report) {
      throw new NotFoundException('Không tìm thấy báo cáo');
    }

    return report;
  }

  // Delete report (admin only, after handling)
  async deleteReport(reportId: string) {
    const report = await this.reportModel.findByIdAndDelete(reportId);

    if (!report) {
      throw new NotFoundException('Không tìm thấy báo cáo');
    }

    return { message: 'Đã xóa báo cáo thành công' };
  }

  // Get report count for a user (useful for admin dashboard)
  async getReportCount(userId: string): Promise<number> {
    return this.reportModel.countDocuments({ reported_id: userId });
  }
}
