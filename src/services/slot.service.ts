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
import { Slot, SlotDocument, SlotType } from '../models/slot.schema';
import { SlotGroup, SlotGroupDocument } from '../models/slot-group.schema';
import {
  SlotPrivate,
  SlotPrivateDocument,
} from '../models/slot-private.schema';
import { Group, GroupDocument } from '../models/group.schema';
import { MessageService } from './message.service';
import { ChatService } from './chat.service';
import { MessageType } from '../models/message.schema';

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
    @Inject(forwardRef(() => MessageService))
    private messageService: MessageService,
    @Inject(forwardRef(() => ChatService))
    private chatService: ChatService,
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

    if (group.leader_id.toString() !== userId) {
      throw new ForbiddenException(
        'Chỉ lãnh đạo nhóm mới có thể tạo lịch học cho nhóm',
      );
    }

    const slot = new this.slotModel({
      title,
      description,
      start_time: startTime,
      end_time: endTime,
      created_by: new Types.ObjectId(userId),
      slot_type: SlotType.Group,
      attachments: attachments || [],
    });

    const savedSlot = await slot.save();

    // Link slot to group
    const slotGroup = new this.slotGroupModel({
      group_id: new Types.ObjectId(groupId),
      slot_id: savedSlot._id,
    });

    await slotGroup.save();

    // Send slot invitation to group chat
    try {
      const groupChat = await this.chatService.findGroupChatByGroupId(groupId);
      if (groupChat) {
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
          },
        });
      }
    } catch (error) {
      console.error('Failed to send slot invitation to chat:', error);
      // Don't fail the slot creation if message sending fails
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

  // Delete slot
  async deleteSlot(slotId: string, userId: string) {
    const slot = await this.slotModel.findById(slotId);

    if (!slot) {
      throw new NotFoundException('Không tìm thấy slot');
    }

    if (slot.created_by.toString() !== userId) {
      throw new ForbiddenException('Chỉ người tạo mới có thể xóa slot');
    }

    // Delete related records
    if (slot.slot_type === SlotType.Group) {
      await this.slotGroupModel.deleteMany({ slot_id: slotId });
    } else {
      await this.slotPrivateModel.deleteMany({ slot_id: slotId });
    }

    await this.slotModel.findByIdAndDelete(slotId);

    return { message: 'Đã xóa slot thành công' };
  }

  // Get slot by ID
  async getSlotById(slotId: string) {
    const slot = await this.slotModel
      .findById(slotId)
      .populate('created_by', 'full_name email avatar');

    if (!slot) {
      throw new NotFoundException('Không tìm thấy slot');
    }

    // Get additional info based on slot type
    if (slot.slot_type === SlotType.Group) {
      const slotGroup = await this.slotGroupModel
        .findOne({ slot_id: slotId })
        .populate('group_id', 'group_name description');

      return {
        ...slot.toObject(),
        group: slotGroup?.group_id,
      };
    } else {
      const slotPrivate = await this.slotPrivateModel
        .findOne({ slot_id: slotId })
        .populate('user1_id user2_id', 'full_name email avatar');

      return {
        ...slot.toObject(),
        participants: [slotPrivate?.user1_id, slotPrivate?.user2_id],
      };
    }
  }

  // Get slots by user (created or participating)
  async getUserSlots(userId: string, slotType?: SlotType) {
    const filter: any = {};

    if (slotType) {
      filter.slot_type = slotType;
    }

    // Get slots created by user
    const createdSlots = await this.slotModel
      .find({ ...filter, created_by: new Types.ObjectId(userId) })
      .populate('created_by', 'full_name email avatar')
      .sort({ start_time: -1 });

    // Get private slots where user is participant
    const privateSlotRecords = await this.slotPrivateModel.find({
      $or: [{ user1_id: userId }, { user2_id: userId }],
    });

    const privateSlotIds: Types.ObjectId[] = [];
    for (const record of privateSlotRecords) {
      privateSlotIds.push(record.slot_id);
    }
    const privateSlots = await this.slotModel
      .find({ _id: { $in: privateSlotIds }, created_by: { $ne: userId } })
      .populate('created_by', 'full_name email avatar')
      .sort({ start_time: -1 });

    // Combine and sort
    const allSlots = [...createdSlots, ...privateSlots].sort(
      (a, b) => b.start_time.getTime() - a.start_time.getTime(),
    );

    return allSlots;
  }

  // Get upcoming slots (within next 7 days)
  async getUpcomingSlots(userId: string) {
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);

    const createdSlots = await this.slotModel
      .find({
        created_by: userId,
        start_time: { $gte: now, $lte: nextWeek },
      })
      .populate('created_by', 'full_name email avatar')
      .sort({ start_time: 1 });

    // Get private slots
    const privateSlotRecords = await this.slotPrivateModel.find({
      $or: [{ user1_id: userId }, { user2_id: userId }],
    });

    const privateSlotIds: Types.ObjectId[] = [];
    for (const record of privateSlotRecords) {
      privateSlotIds.push(record.slot_id);
    }
    const privateSlots = await this.slotModel
      .find({
        _id: { $in: privateSlotIds },
        created_by: { $ne: userId },
        start_time: { $gte: now, $lte: nextWeek },
      })
      .populate('created_by', 'full_name email avatar')
      .sort({ start_time: 1 });

    return [...createdSlots, ...privateSlots].sort(
      (a, b) => a.start_time.getTime() - b.start_time.getTime(),
    );
  }

  // Get slots by group
  async getGroupSlots(groupId: string) {
    const slotGroups = await this.slotGroupModel.find({ group_id: groupId });
    const slotIds: Types.ObjectId[] = [];
    for (const sg of slotGroups) {
      slotIds.push(sg.slot_id);
    }

    return this.slotModel
      .find({ _id: { $in: slotIds } })
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
