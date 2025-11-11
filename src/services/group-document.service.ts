import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  GroupDocument as GroupDocumentSchema,
  GroupDocumentDocument,
} from '../models/group-document.schema';
import { Group, GroupDocument } from '../models/group.schema';
import {
  CreateGroupDocumentDto,
  UpdateGroupDocumentDto,
  GetGroupDocumentsQueryDto,
} from '../dtos/group-document.dto';

@Injectable()
export class GroupDocumentService {
  constructor(
    @InjectModel(GroupDocumentSchema.name)
    private groupDocumentModel: Model<GroupDocumentDocument>,
    @InjectModel(Group.name)
    private groupModel: Model<GroupDocument>,
  ) {}

  /**
   * Create a new group document (only leader can create)
   */
  async createDocument(
    groupId: string,
    dto: CreateGroupDocumentDto,
  ): Promise<GroupDocumentDocument> {
    // Check if group exists
    const group = await this.groupModel.findById(groupId);
    if (!group) {
      throw new NotFoundException('Nhóm không tồn tại');
    }

    // Check if user is the leader
    if (group.leader_id.toString() !== dto.user_id) {
      throw new ForbiddenException('Chỉ lãnh đạo nhóm mới có thể tải tài liệu');
    }

    const document = new this.groupDocumentModel({
      title: dto.title,
      description: dto.description || '',
      attachments: dto.attachments,
      group_id: new Types.ObjectId(groupId),
      uploader_id: new Types.ObjectId(dto.user_id),
    });

    return await document.save();
  }

  /**
   * Get all documents for a group
   */
  async getDocuments(
    groupId: string,
    query: GetGroupDocumentsQueryDto,
  ): Promise<{
    data: GroupDocumentDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '10');
    const skip = (page - 1) * limit;

    const [documents, total] = await Promise.all([
      this.groupDocumentModel
        .find({ group_id: new Types.ObjectId(groupId) })
        .populate('uploader_id', 'full_name email avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.groupDocumentModel.countDocuments({
        group_id: new Types.ObjectId(groupId),
      }),
    ]);

    return {
      data: documents as any,
      total,
      page,
      limit,
    };
  }

  /**
   * Update a document (only leader can update)
   */
  async updateDocument(
    documentId: string,
    dto: UpdateGroupDocumentDto,
  ): Promise<GroupDocumentDocument> {
    const document = await this.groupDocumentModel.findById(documentId);
    if (!document) {
      throw new NotFoundException('Tài liệu không tồn tại');
    }

    // Check if group exists
    const group = await this.groupModel.findById(document.group_id);
    if (!group) {
      throw new NotFoundException('Nhóm không tồn tại');
    }

    // Check if user is the leader
    if (group.leader_id.toString() !== dto.user_id) {
      throw new ForbiddenException(
        'Chỉ lãnh đạo nhóm mới có thể chỉnh sửa tài liệu',
      );
    }

    if (dto.title) document.title = dto.title;
    if (dto.description !== undefined) document.description = dto.description;
    if (dto.attachments) document.attachments = dto.attachments;

    return await document.save();
  }

  /**
   * Delete a document (only leader can delete)
   */
  async deleteDocument(
    documentId: string,
    userId: string,
  ): Promise<{ message: string }> {
    const document = await this.groupDocumentModel.findById(documentId);
    if (!document) {
      throw new NotFoundException('Tài liệu không tồn tại');
    }

    // Check if group exists
    const group = await this.groupModel.findById(document.group_id);
    if (!group) {
      throw new NotFoundException('Nhóm không tồn tại');
    }

    // Check if user is the leader
    if (group.leader_id.toString() !== userId) {
      throw new ForbiddenException('Chỉ lãnh đạo nhóm mới có thể xóa tài liệu');
    }

    await this.groupDocumentModel.findByIdAndDelete(documentId);
    return { message: 'Xóa tài liệu thành công' };
  }

  /**
   * Get a single document by ID
   */
  async getDocumentById(documentId: string): Promise<GroupDocumentDocument> {
    const document = await this.groupDocumentModel
      .findById(documentId)
      .populate('uploader_id', 'full_name email avatar');

    if (!document) {
      throw new NotFoundException('Tài liệu không tồn tại');
    }

    return document;
  }
}
