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
import { Slot, SlotDocument, SlotType, SlotStatus } from '../models/slot.schema';
import { SlotGroup, SlotGroupDocument } from '../models/slot-group.schema';
import {
  SlotPrivate,
  SlotPrivateDocument,
} from '../models/slot-private.schema';
import { Group, GroupDocument } from '../models/group.schema';
import { User, UserDocument } from '../models/user.schema';
import { Notification } from '../models/notification.schema';
import { Task, TaskDocument } from '../models/task.schema';
import { Attendance, AttendanceDocument } from '../models/attendance.schema';
import { MessageService } from './message.service';
import { ChatService } from './chat.service';
import { MessageType } from '../models/message.schema';
import { NotificationGateway } from '../gateways/notification.gateway';

@Injectable()
export class SlotService {
  constructor(
    @InjectModel(Slot.name)
    private slotModel: Model<SlotDocument>,
    @InjectModel(SlotGroup.name)
    private slotGroupModel: Model<SlotGroupDocument>,
    @InjectModel(SlotPrivate.name)
    private slotPrivateModel: Model<SlotPrivateDocument>,
    @InjectModel(Group.name)
    private groupModel: Model<GroupDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(Notification.name)
    private notificationModel: Model<Notification>,
    @InjectModel(Task.name)
    private taskModel: Model<TaskDocument>,
    @InjectModel(Attendance.name)
    private attendanceModel: Model<AttendanceDocument>,
    @Inject(forwardRef(() => MessageService))
    private messageService: MessageService,
    @Inject(forwardRef(() => ChatService))
    private chatService: ChatService,
    @Inject(forwardRef(() => NotificationGateway))
    private notificationGateway: NotificationGateway,
  ) {}

  // Create group slot
  async createGroupSlot(
    userId: string,
    groupId: string,
    title: string,
    description: string,
    startTime: Date,
    endTime: Date,
    attachments?: any[],
  ) {
    if (startTime >= endTime) {
      throw new BadRequestException(
        'Thời gian bắt đầu phải trước thời gian kết thúc',
      );
    }

    if (startTime < new Date()) {
      throw new BadRequestException('Không thể tạo slot trong quá khứ');
    }

    // Check if user is leader of the group
    const group = await this.groupModel.findById(groupId);
    if (!group) {
      throw new NotFoundException('Không tìm thấy nhóm');
    }

    const isLeader = group.leader_id.toString() === userId;

    // Member có thể tạo nhưng cần approval, leader tự động approved
    const slot = new this.slotModel({
      title,
      description,
      start_time: startTime,
      end_time: endTime,
      created_by: new Types.ObjectId(userId),
      slot_type: SlotType.Group,
      attachments: attachments || [],
      status: isLeader ? SlotStatus.APPROVED : SlotStatus.PENDING,
      approved_by: isLeader ? new Types.ObjectId(userId) : null,
      approved_at: isLeader ? new Date() : null,
    });

    const savedSlot = await slot.save();

    // Link slot to group
    const slotGroup = new this.slotGroupModel({
      group_id: new Types.ObjectId(groupId),
      slot_id: savedSlot._id,
    });

    await slotGroup.save();

    // Nếu leader tạo -> gửi invitation ngay, nếu member tạo -> chờ approval
    if (isLeader) {
      // Send slot invitation to group chat
      try {
        const groupChat = await this.chatService.findGroupChatByGroupId(groupId);
        if (groupChat) {
          // Get tasks for this slot
          const tasks = await this.taskModel
            .find({ slot_id: savedSlot._id })
            .select('title description due_date priority status')
            .lean();

          await this.messageService.sendMessage({
            chat_id: (groupChat._id as Types.ObjectId).toString(),
            sender_id: userId,
            content: `📅 Lời mời tham gia lịch học: ${title}`,
            message_type: MessageType.SLOT_INVITATION,
            metadata: {
              slot_id: (savedSlot._id as Types.ObjectId).toString(),
              slot_type: SlotType.Group,
              start_time: startTime.toISOString(),
              end_time: endTime.toISOString(),
              description,
              attachments: attachments || [],
              tasks: tasks || [], // Include tasks in metadata
            },
          });
        }
      } catch (error) {
        console.error('Error sending slot invitation to chat:', error);
      }
    } else {
      // Member tạo slot -> gửi notification cho leader để approve
      try {
        const creator = await this.userModel.findById(userId);
        const notificationContent = `${creator?.full_name || 'Thành viên'} đã tạo lịch học "${title}" và đang chờ phê duyệt`;
        
        const notification = await this.notificationModel.create({
          user_id: group.leader_id,
          type: 'slot_approval_request',
          title: 'Yêu cầu phê duyệt lịch học',
          description: notificationContent,
          actionUrl: `/dashboard/slots/${(savedSlot._id as Types.ObjectId).toString()}`,
          actionLabel: 'Xem chi tiết',
          metadata: {
            slot_id: (savedSlot._id as Types.ObjectId).toString(),
            group_id: groupId,
            creator_id: userId,
            creator_name: creator?.full_name,
            slot_title: title,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
          },
          isRead: false,
        });

        // Emit real-time notification to leader
        this.notificationGateway.sendNotificationToUser(
          group.leader_id.toString(),
          {
            _id: notification._id,
            type: notification.type,
            title: notification.title,
            description: notification.description,
            actionUrl: notification.actionUrl,
            actionLabel: notification.actionLabel,
            metadata: notification.metadata,
            createdAt: new Date(),
          },
        );

        // TODO: Emit real-time notification via WebSocket if needed
      } catch (error) {
        console.error('Error sending approval notification:', error);
      }
    }

    return savedSlot;
  }

  // Create private slot (1-1)
  async createPrivateSlot(
    userId: string,
    friendId: string,
    title: string,
    description: string,
    startTime: Date,
    endTime: Date,
    attachments?: any[],
  ) {
    if (startTime >= endTime) {
      throw new BadRequestException(
        'Thời gian bắt đầu phải trước thời gian kết thúc',
      );
    }

    if (startTime < new Date()) {
      throw new BadRequestException('Không thể tạo slot trong quá khứ');
    }

    const slot = new this.slotModel({
      title,
      description,
      start_time: startTime,
      end_time: endTime,
      created_by: new Types.ObjectId(userId),
      slot_type: SlotType.Private,
      attachments: attachments || [],
    });

    const savedSlot = await slot.save();

    // Sort user IDs (smaller first)
    const [user1, user2] = [userId, friendId].sort();

    // Link slot to private users
    const slotPrivate = new this.slotPrivateModel({
      slot_id: savedSlot._id,
      user1_id: new Types.ObjectId(user1),
      user2_id: new Types.ObjectId(user2),
    });

    await slotPrivate.save();

    // Send slot invitation to private chat
    try {
      const privateChat = await this.chatService.findOrCreatePrivateChat(
        userId,
        friendId,
      );
      if (privateChat) {
        await this.messageService.sendMessage({
          chat_id: (privateChat._id as Types.ObjectId).toString(),
          sender_id: userId,
          content: `📅 Lời mời tham gia lịch học: ${title}`,
          message_type: MessageType.SLOT_INVITATION,
          metadata: {
            slot_id: (savedSlot._id as Types.ObjectId).toString(),
            slot_type: SlotType.Private,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            description,
            attachments: attachments || [],
          },
        });
      }
    } catch (error) {
      console.error('Failed to send slot invitation to chat:', error);
      // Don't throw error, slot creation was successful
    }

    return savedSlot;
  }

  // Update slot
  async updateSlot(
    slotId: string,
    userId: string,
    updates: {
      title?: string;
      description?: string;
      start_time?: Date;
      end_time?: Date;
      attachments?: any[];
    },
  ) {
    const slot = await this.slotModel.findById(slotId);

    if (!slot) {
      throw new NotFoundException('Không tìm thấy slot');
    }

    if (slot.created_by.toString() !== userId) {
      throw new ForbiddenException('Chỉ người tạo mới có thể chỉnh sửa slot');
    }

    if (
      updates.start_time &&
      updates.end_time &&
      updates.start_time >= updates.end_time
    ) {
      throw new BadRequestException(
        'Thời gian bắt đầu phải trước thời gian kết thúc',
      );
    }

    Object.assign(slot, updates);
    return slot.save();
  }

  // Approve pending slot (Leader only)
  async approveSlot(slotId: string, leaderId: string) {
    const slot = await this.slotModel.findById(slotId);
    if (!slot) {
      throw new NotFoundException('Không tìm thấy slot');
    }

    if (slot.status !== SlotStatus.PENDING) {
      throw new BadRequestException('Slot này không cần phê duyệt');
    }

    // Find group to verify leader
    const slotGroup = await this.slotGroupModel.findOne({ slot_id: slot._id });
    if (!slotGroup) {
      throw new NotFoundException('Không tìm thấy thông tin nhóm của slot');
    }

    const group = await this.groupModel.findById(slotGroup.group_id);
    if (!group) {
      throw new NotFoundException('Không tìm thấy nhóm');
    }

    if (group.leader_id.toString() !== leaderId) {
      throw new ForbiddenException('Chỉ lãnh đạo nhóm mới có thể phê duyệt slot');
    }

    // Update slot status
    slot.status = SlotStatus.APPROVED;
    slot.approved_by = new Types.ObjectId(leaderId);
    slot.approved_at = new Date();
    await slot.save();

    // Send slot invitation to group chat
    try {
      const groupChat = await this.chatService.findGroupChatByGroupId(
        slotGroup.group_id.toString(),
      );
      if (groupChat) {
        // Get tasks for this slot
        const tasks = await this.taskModel
          .find({ slot_id: slot._id })
          .select('title description due_date priority status')
          .lean();

        await this.messageService.sendMessage({
          chat_id: (groupChat._id as Types.ObjectId).toString(),
          sender_id: leaderId,
          content: `📅 Lời mời tham gia lịch học: ${slot.title}`,
          message_type: MessageType.SLOT_INVITATION,
          metadata: {
            slot_id: (slot._id as Types.ObjectId).toString(),
            slot_type: SlotType.Group,
            start_time: slot.start_time.toISOString(),
            end_time: slot.end_time.toISOString(),
            description: slot.description,
            attachments: slot.attachments || [],
            tasks: tasks || [], // Include tasks
          },
        });
      }
    } catch (error) {
      console.error('Error sending slot invitation to chat:', error);
    }

    // Notify creator
    try {
      const leader = await this.userModel.findById(leaderId);
      const notification = await this.notificationModel.create({
        user_id: slot.created_by,
        type: 'slot_approved',
        title: 'Lịch học đã được phê duyệt',
        description: `${leader?.full_name || 'Lãnh đạo nhóm'} đã phê duyệt lịch học "${slot.title}"`,
        metadata: {
          slot_id: (slot._id as Types.ObjectId).toString(),
          group_id: slotGroup.group_id.toString(),
          approved_by: leaderId,
          approved_by_name: leader?.full_name,
        },
        isRead: false,
      });

      // Emit real-time notification to creator
      this.notificationGateway.sendNotificationToUser(
        slot.created_by.toString(),
        {
          _id: notification._id,
          type: notification.type,
          title: notification.title,
          description: notification.description,
          metadata: notification.metadata,
          createdAt: new Date(),
        },
      );

      // Emit slot status change event
      this.notificationGateway.server.emit('slotStatusUpdated', {
        slotId: (slot._id as Types.ObjectId).toString(),
        status: SlotStatus.APPROVED,
        approvedBy: leaderId,
        approvedAt: slot.approved_at,
      });
    } catch (error) {
      console.error('Error sending approval notification to creator:', error);
    }

    return slot;
  }

  // Reject pending slot (Leader only)
  async rejectSlot(slotId: string, leaderId: string, reason: string) {
    const slot = await this.slotModel.findById(slotId);
    if (!slot) {
      throw new NotFoundException('Không tìm thấy slot');
    }

    if (slot.status !== SlotStatus.PENDING) {
      throw new BadRequestException('Slot này không thể từ chối');
    }

    // Find group to verify leader
    const slotGroup = await this.slotGroupModel.findOne({ slot_id: slot._id });
    if (!slotGroup) {
      throw new NotFoundException('Không tìm thấy thông tin nhóm của slot');
    }

    const group = await this.groupModel.findById(slotGroup.group_id);
    if (!group) {
      throw new NotFoundException('Không tìm thấy nhóm');
    }

    if (group.leader_id.toString() !== leaderId) {
      throw new ForbiddenException('Chỉ lãnh đạo nhóm mới có thể từ chối slot');
    }

    // Update slot status
    slot.status = SlotStatus.REJECTED;
    slot.rejection_reason = reason;
    await slot.save();

    // Notify creator
    try {
      const leader = await this.userModel.findById(leaderId);
      const notification = await this.notificationModel.create({
        user_id: slot.created_by,
        type: 'slot_rejected',
        title: 'Lịch học bị từ chối',
        description: `${leader?.full_name || 'Lãnh đạo nhóm'} đã từ chối lịch học "${slot.title}"`,
        metadata: {
          slot_id: (slot._id as Types.ObjectId).toString(),
          group_id: slotGroup.group_id.toString(),
          rejected_by: leaderId,
          rejected_by_name: leader?.full_name,
          reason: reason,
        },
        isRead: false,
      });

      // Emit real-time notification to creator
      this.notificationGateway.sendNotificationToUser(
        slot.created_by.toString(),
        {
          _id: notification._id,
          type: notification.type,
          title: notification.title,
          description: notification.description,
          metadata: notification.metadata,
          createdAt: new Date(),
        },
      );

      // Emit slot status change event
      this.notificationGateway.server.emit('slotStatusUpdated', {
        slotId: (slot._id as Types.ObjectId).toString(),
        status: SlotStatus.REJECTED,
        rejectedBy: leaderId,
        rejectionReason: reason,
      });
    } catch (error) {
      console.error('Error sending rejection notification to creator:', error);
    }

    return slot;
  }

  // Delete slot
  async deleteSlot(slotId: string, userId: string) {
    const slotObjectId = new Types.ObjectId(slotId);
    const slot = await this.slotModel.findById(slotObjectId);

    if (!slot) {
      throw new NotFoundException('Không tìm thấy slot');
    }

    if (slot.created_by.toString() !== userId) {
      throw new ForbiddenException('Chỉ người tạo mới có thể xóa slot');
    }

    // Delete related records
    if (slot.slot_type === SlotType.Group) {
      await this.slotGroupModel.deleteMany({ slot_id: slotObjectId });
    } else {
      await this.slotPrivateModel.deleteMany({ slot_id: slotObjectId });
    }

    await this.slotModel.findByIdAndDelete(slotObjectId);

    return { message: 'Đã xóa slot thành công' };
  }

  // Get slot by ID
  async getSlotById(slotId: string) {
    const slotObjectId = new Types.ObjectId(slotId);
    const slot = await this.slotModel
      .findById(slotObjectId)
      .populate('created_by', 'full_name email avatar');

    if (!slot) {
      throw new NotFoundException('Không tìm thấy slot');
    }

    // Get additional info based on slot type
    if (slot.slot_type === SlotType.Group) {
      const slotGroup = await this.slotGroupModel
        .findOne({ slot_id: slotObjectId })
        .populate('group_id', 'group_name description');

      return {
        ...slot.toObject(),
        group: slotGroup?.group_id,
      };
    } else {
      const slotPrivate = await this.slotPrivateModel
        .findOne({ slot_id: slotObjectId })
        .populate('user1_id user2_id', 'full_name email avatar');

      return {
        ...slot.toObject(),
        participants: [slotPrivate?.user1_id, slotPrivate?.user2_id],
      };
    }
  }

  // Get slots by user (created or participating)
  async getUserSlots(userId: string, slotType?: SlotType) {
    const userObjectId = new Types.ObjectId(userId);
    const filter: any = {};

    if (slotType) {
      filter.slot_type = slotType;
    }

    // Get slots created by user
    const createdSlots = await this.slotModel
      .find({ ...filter, created_by: userObjectId })
      .populate('created_by', 'full_name email avatar')
      .sort({ start_time: -1 });

    // Get private slots where user is participant
    const privateSlotRecords = await this.slotPrivateModel.find({
      $or: [{ user1_id: userObjectId }, { user2_id: userObjectId }],
    });

    const privateSlotIds: Types.ObjectId[] = [];
    for (const record of privateSlotRecords) {
      privateSlotIds.push(record.slot_id);
    }
    const privateSlots = await this.slotModel
      .find({ _id: { $in: privateSlotIds }, created_by: { $ne: userObjectId } })
      .populate('created_by', 'full_name email avatar')
      .sort({ start_time: -1 });

    // Get group slots where user has registered via attendance
    const userAttendances = await this.attendanceModel.find({
      user_id: userObjectId,
    });

    const attendanceSlotIds: Types.ObjectId[] = [];
    for (const attendance of userAttendances) {
      attendanceSlotIds.push(attendance.slot_id);
    }

    const groupSlots = await this.slotModel
      .find({
        _id: { $in: attendanceSlotIds },
        slot_type: SlotType.Group,
        created_by: { $ne: userObjectId },
        ...filter,
      })
      .populate('created_by', 'full_name email avatar')
      .sort({ start_time: -1 });

    // Combine and sort - remove duplicates
    const slotIds = new Set<string>();
    const allSlots: any[] = [];

    for (const slot of [...createdSlots, ...privateSlots, ...groupSlots]) {
      const slotId = slot.id;
      if (!slotIds.has(slotId)) {
        slotIds.add(slotId);
        allSlots.push(slot);
      }
    }

    return allSlots.sort(
      (a, b) => b.start_time.getTime() - a.start_time.getTime(),
    );
  }

  // Get upcoming slots (within next 7 days)
  async getUpcomingSlots(userId: string) {
    const userObjectId = new Types.ObjectId(userId);
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);

    const createdSlots = await this.slotModel
      .find({
        created_by: userObjectId,
        start_time: { $gte: now, $lte: nextWeek },
      })
      .populate('created_by', 'full_name email avatar')
      .sort({ start_time: 1 });

    // Get private slots
    const privateSlotRecords = await this.slotPrivateModel.find({
      $or: [{ user1_id: userObjectId }, { user2_id: userObjectId }],
    });

    const privateSlotIds: Types.ObjectId[] = [];
    for (const record of privateSlotRecords) {
      privateSlotIds.push(record.slot_id);
    }
    const privateSlots = await this.slotModel
      .find({
        _id: { $in: privateSlotIds },
        created_by: { $ne: userObjectId },
        start_time: { $gte: now, $lte: nextWeek },
      })
      .populate('created_by', 'full_name email avatar')
      .sort({ start_time: 1 });

    // Get group slots where user has registered via attendance
    const userAttendances = await this.attendanceModel.find({
      user_id: userObjectId,
    });

    const attendanceSlotIds: Types.ObjectId[] = [];
    for (const attendance of userAttendances) {
      attendanceSlotIds.push(attendance.slot_id);
    }

    const upcomingGroupSlots = await this.slotModel
      .find({
        _id: { $in: attendanceSlotIds },
        slot_type: SlotType.Group,
        created_by: { $ne: userObjectId },
        start_time: { $gte: now, $lte: nextWeek },
      })
      .populate('created_by', 'full_name email avatar')
      .sort({ start_time: 1 });

    // Combine and sort - remove duplicates
    const upcomingSlotIds = new Set<string>();
    const allUpcomingSlots: any[] = [];

    for (const slot of [...createdSlots, ...privateSlots, ...upcomingGroupSlots]) {
      const slotId = slot.id;
      if (!upcomingSlotIds.has(slotId)) {
        upcomingSlotIds.add(slotId);
        allUpcomingSlots.push(slot);
      }
    }

    return allUpcomingSlots.sort(
      (a, b) => a.start_time.getTime() - b.start_time.getTime(),
    );
  }

  // Get slots by group
  async getGroupSlots(groupId: string) {
    const groupObjectId = new Types.ObjectId(groupId);
    const slotGroups = await this.slotGroupModel.find({
      group_id: groupObjectId,
    });
    const slotIds: Types.ObjectId[] = [];
    for (const sg of slotGroups) {
      slotIds.push(sg.slot_id);
    }

    return this.slotModel
      .find({ _id: { $in: slotIds } })
      .populate('created_by', 'full_name email avatar')
      .sort({ start_time: -1 });
  }

  // Get user's group slots (slots from groups user is member of)
  async getUserGroupSlots(userId: string) {
    // First, find all groups user is member of
    const groupMemberModel = this.groupModel.db.model('GroupMember');
    const userGroups = await groupMemberModel.find({ 
      user_id: new Types.ObjectId(userId) 
    });
    
    const groupIds = userGroups.map(gm => gm.group_id);

    // Find all slots belonging to these groups
    const slotGroups = await this.slotGroupModel.find({ 
      group_id: { $in: groupIds } 
    });
    
    const slotIds = slotGroups.map(sg => sg.slot_id);

    return this.slotModel
      .find({ 
        _id: { $in: slotIds },
        status: SlotStatus.APPROVED // Only show approved slots
      })
      .populate('created_by', 'full_name email avatar')
      .sort({ start_time: -1 });
  }

  // Get user's private slots
  async getUserPrivateSlots(userId: string) {
    const privateSlotRecords = await this.slotPrivateModel.find({
      $or: [
        { user1_id: new Types.ObjectId(userId) }, 
        { user2_id: new Types.ObjectId(userId) }
      ],
    });

    const slotIds = privateSlotRecords.map(record => record.slot_id);

    return this.slotModel
      .find({ _id: { $in: slotIds } })
      .populate('created_by', 'full_name email avatar')
      .sort({ start_time: -1 });
  }

  // Get slots user has registered for (via attendance)
  async getUserRegisteredSlots(userId: string) {
    const attendanceModel = this.groupModel.db.model('Attendance');
    const attendances = await attendanceModel.find({ 
      user_id: new Types.ObjectId(userId) 
    });

    const slotIds = attendances.map(att => att.slot_id);

    return this.slotModel
      .find({ _id: { $in: slotIds } })
      .populate('created_by', 'full_name email avatar')
      .sort({ start_time: -1 });
  }

  // Get user's created slots
  async getUserCreatedSlots(userId: string) {
    return this.slotModel
      .find({ created_by: new Types.ObjectId(userId) })
      .populate('created_by', 'full_name email avatar')
      .sort({ start_time: -1 });
  }

  // Check if slot has started
  async hasSlotStarted(slotId: string): Promise<boolean> {
    const slot = await this.slotModel.findById(slotId);
    if (!slot) return false;
    return new Date() >= slot.start_time;
  }

  // Check if slot has ended
  async hasSlotEnded(slotId: string): Promise<boolean> {
    const slot = await this.slotModel.findById(slotId);
    if (!slot) return false;
    return new Date() >= slot.end_time;
  }
}
