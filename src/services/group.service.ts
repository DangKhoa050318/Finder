import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Group, GroupDocument, GroupVisibility } from '../models/group.schema';
import {
  GroupMember,
  GroupMemberDocument,
  GroupMemberRole,
} from '../models/group-member.schema';

@Injectable()
export class GroupService {
  constructor(
    @InjectModel(Group.name)
    private groupModel: Model<GroupDocument>,
    @InjectModel(GroupMember.name)
    private groupMemberModel: Model<GroupMemberDocument>,
  ) {}

  // Create group
  async createGroup(
    leaderId: string,
    groupName: string,
    description: string = '',
    visibility: GroupVisibility = GroupVisibility.Public,
    maxMember: number = 50,
  ): Promise<GroupDocument> {
    const group = new this.groupModel({
      group_name: groupName,
      description,
      leader_id: new Types.ObjectId(leaderId),
      visibility,
      max_member: maxMember,
    });

    const savedGroup = await group.save();

    // Auto-add leader as member
    await this.addMember(
      (savedGroup._id as any).toString(),
      leaderId,
      GroupMemberRole.Leader,
    );

    return savedGroup;
  }

  // Update group
  async updateGroup(
    groupId: string,
    leaderId: string,
    updates: {
      group_name?: string;
      description?: string;
      visibility?: GroupVisibility;
      max_member?: number;
    },
  ) {
    const group = await this.groupModel.findById(groupId);

    if (!group) {
      throw new NotFoundException('Không tìm thấy nhóm');
    }

    if (group.leader_id.toString() !== leaderId) {
      throw new ForbiddenException('Chỉ trưởng nhóm mới có thể chỉnh sửa');
    }

    Object.assign(group, updates);
    return group.save();
  }

  // Delete group
  async deleteGroup(groupId: string, leaderId: string) {
    const group = await this.groupModel.findById(groupId);

    if (!group) {
      throw new NotFoundException('Không tìm thấy nhóm');
    }

    if (group.leader_id.toString() !== leaderId) {
      throw new ForbiddenException('Chỉ trưởng nhóm mới có thể xóa nhóm');
    }

    // Delete all members
    await this.groupMemberModel.deleteMany({ group_id: groupId });

    // Delete group
    await this.groupModel.findByIdAndDelete(groupId);

    return { message: 'Đã xóa nhóm thành công' };
  }

  // Get group by ID
  async getGroupById(groupId: string) {
    const group = await this.groupModel
      .findById(groupId)
      .populate('leader_id', 'full_name email avatar');

    if (!group) {
      throw new NotFoundException('Không tìm thấy nhóm');
    }

    // Get member count
    const memberCount = await this.groupMemberModel.countDocuments({
      group_id: groupId,
    });

    return {
      ...group.toObject(),
      memberCount,
    };
  }

  // Get all groups (with filter)
  async getGroups(
    page: number = 1,
    limit: number = 20,
    visibility?: GroupVisibility,
    search?: string,
  ) {
    const skip = (page - 1) * limit;
    const filter: any = {};

    if (visibility) {
      filter.visibility = visibility;
    }

    if (search) {
      filter.$or = [
        { group_name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
      ];
    }

    const [groups, total] = await Promise.all([
      this.groupModel
        .find(filter)
        .populate('leader_id', 'full_name email avatar')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit),
      this.groupModel.countDocuments(filter),
    ]);

    return {
      groups,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Join group
  async joinGroup(groupId: string, userId: string) {
    const group = await this.groupModel.findById(groupId);

    if (!group) {
      throw new NotFoundException('Không tìm thấy nhóm');
    }

    // Check if already a member
    const existingMember = await this.groupMemberModel.findOne({
      group_id: groupId,
      user_id: userId,
    });

    if (existingMember) {
      throw new BadRequestException('Đã là thành viên của nhóm');
    }

    // Check member count
    const memberCount = await this.groupMemberModel.countDocuments({
      group_id: groupId,
    });
    if (memberCount >= group.max_member) {
      throw new BadRequestException('Nhóm đã đầy');
    }

    return this.addMember(groupId, userId, GroupMemberRole.Member);
  }

  // Leave group
  async leaveGroup(groupId: string, userId: string) {
    const group = await this.groupModel.findById(groupId);

    if (!group) {
      throw new NotFoundException('Không tìm thấy nhóm');
    }

    // Leader cannot leave their own group
    if (group.leader_id.toString() === userId) {
      throw new BadRequestException(
        'Trưởng nhóm không thể rời nhóm. Hãy chuyển quyền trưởng nhóm hoặc xóa nhóm.',
      );
    }

    const result = await this.groupMemberModel.findOneAndDelete({
      group_id: groupId,
      user_id: userId,
    });

    if (!result) {
      throw new NotFoundException('Bạn không phải thành viên của nhóm này');
    }

    return { message: 'Đã rời nhóm thành công' };
  }

  // Get group members
  async getGroupMembers(groupId: string) {
    return this.groupMemberModel
      .find({ group_id: groupId })
      .populate('user_id', 'full_name email avatar')
      .sort({ joined_at: 1 });
  }

  // Remove member (leader only)
  async removeMember(groupId: string, leaderId: string, memberId: string) {
    const group = await this.groupModel.findById(groupId);

    if (!group) {
      throw new NotFoundException('Không tìm thấy nhóm');
    }

    if (group.leader_id.toString() !== leaderId) {
      throw new ForbiddenException('Chỉ trưởng nhóm mới có thể xóa thành viên');
    }

    if (leaderId === memberId) {
      throw new BadRequestException('Không thể tự xóa mình khỏi nhóm');
    }

    const result = await this.groupMemberModel.findOneAndDelete({
      group_id: groupId,
      user_id: memberId,
    });

    if (!result) {
      throw new NotFoundException('Thành viên không tồn tại trong nhóm');
    }

    return { message: 'Đã xóa thành viên thành công' };
  }

  // Transfer leadership
  async transferLeadership(
    groupId: string,
    currentLeaderId: string,
    newLeaderId: string,
  ) {
    const group = await this.groupModel.findById(groupId);

    if (!group) {
      throw new NotFoundException('Không tìm thấy nhóm');
    }

    if (group.leader_id.toString() !== currentLeaderId) {
      throw new ForbiddenException('Chỉ trưởng nhóm mới có thể chuyển quyền');
    }

    // Check if new leader is a member
    const newLeader = await this.groupMemberModel.findOne({
      group_id: groupId,
      user_id: newLeaderId,
    });

    if (!newLeader) {
      throw new BadRequestException(
        'Người được chuyển quyền phải là thành viên của nhóm',
      );
    }

    // Update group leader
    group.leader_id = new Types.ObjectId(newLeaderId);
    await group.save();

    // Update old leader role to member
    await this.groupMemberModel.findOneAndUpdate(
      { group_id: groupId, user_id: currentLeaderId },
      { role: GroupMemberRole.Member },
    );

    // Update new leader role
    newLeader.role = GroupMemberRole.Leader;
    await newLeader.save();

    return { message: 'Đã chuyển quyền trưởng nhóm thành công' };
  }

  // Helper: Add member
  async addMember(groupId: string, userId: string, role: GroupMemberRole) {
    const member = new this.groupMemberModel({
      group_id: new Types.ObjectId(groupId),
      user_id: new Types.ObjectId(userId),
      role,
    });

    return member.save();
  }

  // Check if user is group leader
  async isGroupLeader(groupId: string, userId: string): Promise<boolean> {
    const group = await this.groupModel.findById(groupId);
    return group?.leader_id.toString() === userId;
  }

  // Check if user is group member
  async isGroupMember(groupId: string, userId: string): Promise<boolean> {
    const member = await this.groupMemberModel.findOne({
      group_id: groupId,
      user_id: userId,
    });
    return !!member;
  }
}
