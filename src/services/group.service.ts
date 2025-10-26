import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Group, GroupDocument, GroupVisibility } from '../models/group.schema';
import {
  GroupMember,
  GroupMemberDocument,
  GroupMemberRole,
} from '../models/group-member.schema';
import { ChatService } from './chat.service';
import { NotificationService } from './notification.service';

@Injectable()
export class GroupService {
  constructor(
    @InjectModel(Group.name)
    private groupModel: Model<GroupDocument>,
    @InjectModel(GroupMember.name)
    private groupMemberModel: Model<GroupMemberDocument>,
    @Inject(forwardRef(() => ChatService))
    private chatService: ChatService,
    private notificationService: NotificationService,
  ) {}

  // Create group
  async createGroup(
    leaderId: string,
    groupName: string,
    description: string = '',
    visibility: GroupVisibility = GroupVisibility.Public,
    maxMember: number = 50,
  ): Promise<any> {
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

    // Auto-create group chat
    try {
      await this.chatService.createGroupChat(
        (savedGroup._id as any).toString(),
        [leaderId],
      );
    } catch (error) {
      // Log error but don't fail the group creation
      console.error('Failed to create group chat:', error);
    }

    return savedGroup;
  }

  // Update group
  async updateGroup(
    groupId: string,
    leaderId: string,
    updates: {
      group_name?: string;
      description?: string;
      avatar?: string;
      visibility?: GroupVisibility;
      max_member?: number;
      meeting_link?: string;
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
    const groupObjectId = new Types.ObjectId(groupId);
    const group = await this.groupModel.findById(groupObjectId);

    if (!group) {
      throw new NotFoundException('Không tìm thấy nhóm');
    }

    if (group.leader_id.toString() !== leaderId) {
      throw new ForbiddenException('Chỉ trưởng nhóm mới có thể xóa nhóm');
    }

    // Delete all members
    await this.groupMemberModel.deleteMany({ group_id: groupObjectId });

    // Delete associated group chat and all related data (participants, messages)
    try {
      await this.chatService.deleteGroupChat(groupId);
    } catch (error) {
      // Log error but don't fail the group deletion
      console.error('Failed to delete group chat:', error);
    }

    // Delete group
    await this.groupModel.findByIdAndDelete(groupObjectId);

    return { message: 'Đã xóa nhóm thành công' };
  }

  // Get group by ID
  async getGroupById(groupId: string) {
    const groupObjectId = new Types.ObjectId(groupId);
    const group = await this.groupModel
      .findById(groupObjectId)
      .populate('leader_id', 'full_name email avatar');

    if (!group) {
      throw new NotFoundException('Không tìm thấy nhóm');
    }

    // Get member count
    const memberCount = await this.groupMemberModel.countDocuments({
      group_id: groupObjectId,
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

    const groups = await this.groupModel
      .find(filter)
      .populate('leader_id', 'full_name email avatar')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    const total = await this.groupModel.countDocuments(filter);

    // Add member count to each group
    const groupsWithMembers: any[] = [];
    for (const group of groups) {
      const memberCount = await this.groupMemberModel.countDocuments({
        group_id: group._id,
      });
      groupsWithMembers.push({
        ...group.toObject(),
        memberCount,
      });
    }

    return {
      data: groupsWithMembers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Get groups of a specific user (groups they are a member of)
  async getUserGroups(userId: string) {
    const userObjectId = new Types.ObjectId(userId);

    // Find all group memberships for this user
    const memberships = await this.groupMemberModel
      .find({ user_id: userObjectId })
      .select('group_id');

    const groupIds: Types.ObjectId[] = memberships.map((m) => m.group_id);

    // Get group details with member count
    const groups = await this.groupModel
      .find({ _id: { $in: groupIds } })
      .populate('leader_id', 'full_name email avatar')
      .sort({ created_at: -1 });

    // Add member count to each group
    const groupsWithMembers = await Promise.all(
      groups.map(async (group) => {
        const memberCount = await this.groupMemberModel.countDocuments({
          group_id: group._id,
        });
        return {
          ...group.toObject(),
          memberCount,
        };
      }),
    );

    return groupsWithMembers;
  }

  // Join group
  async joinGroup(groupId: string, userId: string) {
    const groupObjectId = new Types.ObjectId(groupId);
    const userObjectId = new Types.ObjectId(userId);

    const group = await this.groupModel.findById(groupObjectId);

    if (!group) {
      throw new NotFoundException('Không tìm thấy nhóm');
    }

    // Check if already a member
    const existingMember = await this.groupMemberModel.findOne({
      group_id: groupObjectId,
      user_id: userObjectId,
    });

    if (existingMember) {
      throw new BadRequestException('Đã là thành viên của nhóm');
    }

    // Check member count
    const memberCount = await this.groupMemberModel.countDocuments({
      group_id: groupObjectId,
    });
    if (memberCount >= group.max_member) {
      throw new BadRequestException('Nhóm đã đầy');
    }

    await this.addMember(groupId, userId, GroupMemberRole.Member);

    // Auto-add user to group chat
    try {
      const groupChat = await this.chatService.findGroupChatByGroupId(groupId);
      if (groupChat) {
        await this.chatService.addMemberToChat(
          (groupChat._id as any).toString(),
          userId,
        );
      }
    } catch (error) {
      // Log error but don't fail the group join
      console.error('Failed to add user to group chat:', error);
    }

    // Send notification to all group members (except the new member)
    try {
      const members = await this.groupMemberModel
        .find({ group_id: groupObjectId })
        .populate('user_id', 'full_name');

      const newMember = await this.groupMemberModel
        .findOne({ group_id: groupObjectId, user_id: userObjectId })
        .populate('user_id', 'full_name');

      if (newMember && newMember.user_id) {
        const memberUserIds = members
          .filter((m) => m.user_id._id.toString() !== userId)
          .map((m) => m.user_id._id.toString());

        if (memberUserIds.length > 0) {
          await this.notificationService.sendGroupMemberJoinedNotification(
            memberUserIds,
            group.group_name,
            (newMember.user_id as any).full_name,
            groupId,
            group.avatar,
          );
        }
      }
    } catch (error) {
      console.error('Failed to send group join notification:', error);
    }

    // Return updated group with memberCount
    return this.getGroupById(groupId);
  }

  // Leave group
  async leaveGroup(groupId: string, userId: string) {
    const groupObjectId = new Types.ObjectId(groupId);
    const userObjectId = new Types.ObjectId(userId);

    const group = await this.groupModel.findById(groupObjectId);

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
      group_id: groupObjectId,
      user_id: userObjectId,
    });

    if (!result) {
      throw new NotFoundException('Bạn không phải thành viên của nhóm này');
    }

    return { message: 'Đã rời nhóm thành công' };
  }

  // Get group members
  async getGroupMembers(groupId: string) {
    const groupObjectId = new Types.ObjectId(groupId);

    const members = await this.groupMemberModel
      .find({ group_id: groupObjectId })
      .populate('user_id', 'full_name email avatar')
      .sort({ joined_at: 1 });

    // Extract user data from populated user_id
    return members.map((member) => ({
      _id: (member.user_id as any)._id,
      full_name: (member.user_id as any).full_name,
      email: (member.user_id as any).email,
      avatar: (member.user_id as any).avatar,
    }));
  }

  // Remove member (leader only)
  async removeMember(groupId: string, leaderId: string, memberId: string) {
    const groupObjectId = new Types.ObjectId(groupId);
    const leaderObjectId = new Types.ObjectId(leaderId);
    const memberObjectId = new Types.ObjectId(memberId);

    const group = await this.groupModel.findById(groupObjectId);

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
      group_id: groupObjectId,
      user_id: memberObjectId,
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
    const groupObjectId = new Types.ObjectId(groupId);
    const currentLeaderObjectId = new Types.ObjectId(currentLeaderId);
    const newLeaderObjectId = new Types.ObjectId(newLeaderId);

    const group = await this.groupModel.findById(groupObjectId);

    if (!group) {
      throw new NotFoundException('Không tìm thấy nhóm');
    }

    if (group.leader_id.toString() !== currentLeaderId) {
      throw new ForbiddenException('Chỉ trưởng nhóm mới có thể chuyển quyền');
    }

    // Check if new leader is a member
    const newLeader = await this.groupMemberModel.findOne({
      group_id: groupObjectId,
      user_id: newLeaderObjectId,
    });

    if (!newLeader) {
      throw new BadRequestException(
        'Người được chuyển quyền phải là thành viên của nhóm',
      );
    }

    // Update group leader
    group.leader_id = newLeaderObjectId;
    await group.save();

    // Update old leader role to member
    await this.groupMemberModel.findOneAndUpdate(
      { group_id: groupObjectId, user_id: currentLeaderObjectId },
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
    const groupObjectId = new Types.ObjectId(groupId);
    const group = await this.groupModel.findById(groupObjectId);
    return group?.leader_id.toString() === userId;
  }

  // Check if user is group member
  async isGroupMember(groupId: string, userId: string): Promise<boolean> {
    const groupObjectId = new Types.ObjectId(groupId);
    const userObjectId = new Types.ObjectId(userId);

    const member = await this.groupMemberModel.findOne({
      group_id: groupObjectId,
      user_id: userObjectId,
    });
    return !!member;
  }
}
