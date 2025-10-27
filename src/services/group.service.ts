import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';

import { Group, GroupDocument, GroupVisibility } from '../models/group.schema';
import {
  GroupMember,
  GroupMemberDocument,
  GroupMemberRole,
} from '../models/group-member.schema';
import { ChatService } from './chat.service';
import { NotificationService } from './notification.service';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../models/user.schema';
import { Model, Types } from 'mongoose';
import { NotificationType } from '../models/notification.schema';

@Injectable()
export class GroupService {
  constructor(
    @InjectModel(Group.name)
    private groupModel: Model<GroupDocument>,
    @InjectModel(GroupMember.name)
    private groupMemberModel: Model<GroupMemberDocument>,
    @InjectModel('User') private userModel: Model<UserDocument>,
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

    // Instead of auto-joining, create a join request notification for the leader
    try {
      // fetch requester info
      const requester = await this.userModel.findById(userObjectId).lean();
      const leaderId = (group.leader_id as any).toString();

      // Delete any existing pending join requests from this user for this group
      // to avoid duplicates when user clicks "Join" multiple times
      const deletedCount =
        await this.notificationService.deletePendingJoinRequests(
          leaderId,
          userId,
          groupId,
        );

      if (deletedCount > 0) {
        console.log(
          `Deleted ${deletedCount} old join request(s) from user ${userId} for group ${groupId}`,
        );
      }

      await this.notificationService.sendGroupJoinRequestNotification(
        leaderId,
        requester?.full_name ?? 'Người dùng',
        userId,
        groupId,
        group.group_name,
        requester?.avatar,
      );
    } catch (error) {
      console.error('Failed to create join request notification:', error);
    }

    return { message: 'Yêu cầu tham gia đã được gửi cho trưởng nhóm' };
  }

  /**
   * Leader responds to a join request notification
   * notificationId: id of GROUP_JOIN_REQUEST notification
   */
  async respondToJoinRequest(
    groupId: string,
    leaderId: string,
    notificationId: string,
    approve: boolean,
  ) {
    // validate leader
    const isLeader = await this.isGroupLeader(groupId, leaderId);
    if (!isLeader) {
      throw new ForbiddenException('Chỉ trưởng nhóm mới có quyền duyệt yêu cầu');
    }

    // Fetch notification
    const notification = await this.notificationService.getNotificationById(
      notificationId,
    );

    if (!notification || notification.type !== 'group_join_request') {
      throw new BadRequestException('Yêu cầu không hợp lệ');
    }

    const requesterId = notification.metadata?.requesterId;
    if (!requesterId) {
      throw new BadRequestException('Không tìm thấy thông tin người yêu cầu');
    }

    if (approve) {
      // Add member
      await this.addMember(groupId, requesterId, GroupMemberRole.Member);

      // Add to chat if exists
      try {
        const groupChat = await this.chatService.findGroupChatByGroupId(groupId);
        if (groupChat) {
          await this.chatService.addMemberToChat(
            (groupChat._id as any).toString(),
            requesterId,
          );
        }
      } catch (error) {
        console.error('Failed to add user to group chat on approve:', error);
      }

      // Notify group members about new member
      try {
        const members = await this.groupMemberModel
          .find({ group_id: new Types.ObjectId(groupId) })
          .populate('user_id', 'full_name');

        const memberUserIds = members
          .filter((m) => m.user_id._id.toString() !== requesterId)
          .map((m) => m.user_id._id.toString());

        if (memberUserIds.length > 0) {
          const requesterUser = await this.userModel.findById(requesterId);
          if (requesterUser) {
            // Get group name from metadata or fetch from database
            const groupName =
              (notification.metadata?.groupName as string) ||
              (await this.groupModel.findById(groupId))?.group_name ||
              'Nhóm';

            await this.notificationService.sendGroupMemberJoinedNotification(
              memberUserIds,
              groupName,
              requesterUser.full_name,
              groupId,
              undefined,
            );
          }
        }
      } catch (error) {
        console.error('Failed to notify members about approved join:', error);
      }

      // Notify requester about approval
      const leaderUser = await this.userModel.findById(leaderId);
      await this.notificationService.sendGroupJoinRequestResultNotification(
        requesterId,
        leaderUser?.full_name ?? 'Trưởng nhóm',
        groupId,
        '',
        true,
      );
    } else {
      // Notify requester about rejection
      const leaderUser = await this.userModel.findById(leaderId);
      await this.notificationService.sendGroupJoinRequestResultNotification(
        requesterId,
        leaderUser?.full_name ?? 'Trưởng nhóm',
        groupId,
        '',
        false,
      );
    }

    // Mark the original notification as read/updated
    await this.notificationService.updateNotification(notificationId, {
      isRead: true,
      metadata: {
        ...notification.metadata,
        handled: true,
        handledBy: leaderId,
        approved: approve,
      },
    });

    return { message: approve ? 'Đã chấp nhận yêu cầu' : 'Đã từ chối yêu cầu' };
  }

  /**
   * Invite user to group (by member or leader)
   */
  async inviteUser(groupId: string, inviterId: string, targetUserId: string) {
    const group = await this.groupModel.findById(new Types.ObjectId(groupId));
    if (!group) throw new NotFoundException('Không tìm thấy nhóm');

    // Check inviter is member of group
    const inviterIsMember = await this.isGroupMember(groupId, inviterId);
    if (!inviterIsMember) {
      throw new ForbiddenException('Chỉ thành viên mới có thể mời người khác');
    }

    // Check target not already member
    const alreadyMember = await this.isGroupMember(groupId, targetUserId);
    if (alreadyMember) {
      throw new BadRequestException('Người này đã là thành viên');
    }

    // Fetch inviter info
    const inviter = await this.userModel.findById(new Types.ObjectId(inviterId)).lean();

    // Send invite notification to target user
    await this.notificationService.sendGroupInviteNotification(
      targetUserId,
      inviter?.full_name ?? 'Người dùng',
      inviterId,
      groupId,
      group.group_name,
      inviter?.avatar,
    );

    return { message: 'Đã gửi lời mời tới người dùng' };
  }

  /**
   * Accept an invite notification (target user action)
   * If inviter was leader, directly add user. Otherwise create join request to leader.
   */
  async acceptInvite(notificationId: string, targetUserId: string) {
    const notification = await this.notificationService.getNotificationById(
      notificationId,
    );

    if (!notification || notification.type !== 'group_invite') {
      throw new BadRequestException('Lời mời không tồn tại');
    }

    // Ensure this invite is for target user
    if (notification.user_id.toString() !== targetUserId) {
      throw new ForbiddenException('Không có quyền chấp nhận lời mời này');
    }

    const groupId = (notification.relatedId as any).toString();
    const inviterId = notification.metadata?.inviterId;

    if (!inviterId) throw new BadRequestException('Không tìm thấy người mời');

    // If inviter is leader, directly add
    const inviterIsLeader = await this.isGroupLeader(groupId, inviterId);
    if (inviterIsLeader) {
      // add member
      await this.addMember(groupId, targetUserId, GroupMemberRole.Member);

      // add to chat
      try {
        const groupChat = await this.chatService.findGroupChatByGroupId(groupId);
        if (groupChat) {
          await this.chatService.addMemberToChat(
            (groupChat._id as any).toString(),
            targetUserId,
          );
        }
      } catch (error) {
        console.error('Failed to add invited user to chat:', error);
      }

      // notify members
      const members = await this.groupMemberModel
        .find({ group_id: new Types.ObjectId(groupId) })
        .populate('user_id', 'full_name');

      const memberUserIds = members.map((m) => m.user_id._id.toString());
      const targetUser = await this.userModel.findById(targetUserId);
      if (targetUser) {
        // Get group name from metadata or fetch from database
        const groupName =
          (notification.metadata?.groupName as string) ||
          (await this.groupModel.findById(groupId))?.group_name ||
          'Nhóm';

        await this.notificationService.sendGroupMemberJoinedNotification(
          memberUserIds,
          groupName,
          targetUser.full_name,
          groupId,
          undefined,
        );
      }

      // mark invite notification handled
      await this.notificationService.updateNotification(notificationId, {
        isRead: true,
        metadata: {
          ...notification.metadata,
          handled: true,
          acceptedBy: targetUserId,
          autoAdded: true,
        },
      });

      return { message: 'Đã chấp nhận lời mời và được thêm vào nhóm' };
    }

    // Otherwise create a join request to leader on behalf of the invitee
    const group = await this.groupModel.findById(new Types.ObjectId(groupId));
    if (!group) {
      throw new NotFoundException('Không tìm thấy nhóm');
    }
    
    const inviter = await this.userModel.findById(new Types.ObjectId(inviterId));
    const requester = await this.userModel.findById(new Types.ObjectId(targetUserId));

    if (!requester) {
      throw new NotFoundException('Không tìm thấy thông tin người được mời');
    }

    const leaderId = (group.leader_id as any).toString();

    // Delete any existing pending join requests from this user for this group
    const deletedCount =
      await this.notificationService.deletePendingJoinRequests(
        leaderId,
        targetUserId,
        groupId,
      );

    if (deletedCount > 0) {
      console.log(
        `Deleted ${deletedCount} old join request(s) from invited user ${targetUserId} for group ${groupId}`,
      );
    }

    await this.notificationService.sendGroupJoinRequestNotification(
      leaderId,
      requester.full_name,
      targetUserId,
      groupId,
      group.group_name,
      requester.avatar,
    );

    // mark invite notification accepted but awaiting leader
    await this.notificationService.updateNotification(notificationId, {
      isRead: true,
      metadata: {
        ...notification.metadata,
        handled: true,
        acceptedBy: targetUserId,
        awaitingLeader: true,
      },
    });

    // notify inviter that invitee accepted and waiting for leader approval
    await this.notificationService.createNotification({
      user_id: inviterId,
      type: NotificationType.SYSTEM,
      title: `${requester.full_name} đã chấp nhận lời mời, đang chờ trưởng nhóm duyệt`,
      relatedId: groupId,
      actionUrl: `/dashboard/groups/${groupId}`,
      actionLabel: 'Xem nhóm',
    });

    return { message: 'Đã chấp nhận lời mời, đang chờ trưởng nhóm duyệt' };
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
