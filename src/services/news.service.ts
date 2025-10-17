import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { News, NewsDocument } from '../models/news.schema';

@Injectable()
export class NewsService {
  constructor(
    @InjectModel(News.name)
    private newsModel: Model<NewsDocument>,
  ) {}

  // Create news (admin only)
  async createNews(authorId: string, title: string, content: string) {
    const news = new this.newsModel({
      author_id: new Types.ObjectId(authorId),
      title,
      content,
    });

    return news.save();
  }

  // Update news (admin only)
  async updateNews(newsId: string, updates: { title?: string; content?: string }) {
    const news = await this.newsModel.findByIdAndUpdate(
      newsId,
      { $set: updates },
      { new: true },
    ).populate('author_id', 'full_name email');

    if (!news) {
      throw new NotFoundException('Không tìm thấy tin tức');
    }

    return news;
  }

  // Delete news (admin only)
  async deleteNews(newsId: string) {
    const news = await this.newsModel.findByIdAndDelete(newsId);

    if (!news) {
      throw new NotFoundException('Không tìm thấy tin tức');
    }

    return { message: 'Đã xóa tin tức thành công' };
  }

  // Get all news with pagination
  async getAllNews(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [news, total] = await Promise.all([
      this.newsModel
        .find()
        .populate('author_id', 'full_name email')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit),
      this.newsModel.countDocuments(),
    ]);

    return {
      news,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Get news by ID
  async getNewsById(newsId: string) {
    const news = await this.newsModel
      .findById(newsId)
      .populate('author_id', 'full_name email');

    if (!news) {
      throw new NotFoundException('Không tìm thấy tin tức');
    }

    return news;
  }

  // Get latest news (for homepage)
  async getLatestNews(limit: number = 5) {
    return this.newsModel
      .find()
      .populate('author_id', 'full_name')
      .sort({ created_at: -1 })
      .limit(limit);
  }

  // Search news by title or content
  async searchNews(query: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const searchRegex = new RegExp(query, 'i');

    const [news, total] = await Promise.all([
      this.newsModel
        .find({
          $or: [
            { title: searchRegex },
            { content: searchRegex },
          ],
        })
        .populate('author_id', 'full_name email')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit),
      this.newsModel.countDocuments({
        $or: [
          { title: searchRegex },
          { content: searchRegex },
        ],
      }),
    ]);

    return {
      news,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}
