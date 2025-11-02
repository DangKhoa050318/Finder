import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Chat, ChatDocument, ChatType } from '../models/chat.schema';
import {
  ChatParticipant,
  ChatParticipantDocument,
} from '../models/chat-participant.schema';
import { Group, GroupDocument } from '../models/group.schema';
import { Message, MessageDocument } from '../models/message.schema';
import { User, UserDocument } from '../models/user.schema';
import { UserChatDetailDto } from '../dtos/chat.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
    @InjectModel(ChatParticipant.name)
    private chatParticipantModel: Model<ChatParticipantDocument>,
    @InjectModel(Group.name) private groupModel: Model<GroupDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel('User') private userModel: Model<UserDocument>,
  ) {}

  /**
   * Tạo hoặc tìm private chat giữa 2 users
   */
  async findOrCreatePrivateChat(
    user1_id: string,
    user2_id: string,
  ): Promise<ChatDocument> {
    // Validate
    if (user1_id === user2_id) {
      throw new BadRequestException('Không thể tạo chat với chính mình');
    }

    // Validate ObjectId format
    if (
      !Types.ObjectId.isValid(user1_id) ||
      !Types.ObjectId.isValid(user2_id)
    ) {
      throw new BadRequestException('User ID không hợp lệ');
    }

    // Check users exist
    const [user1, user2] = await Promise.all([
      this.userModel.findById(user1_id).lean(),
      this.userModel.findById(user2_id).lean(),
    ]);

    if (!user1 || !user2) {
      throw new NotFoundException('Một hoặc cả hai user không tồn tại');
    }

    const user1ObjectId = new Types.ObjectId(user1_id);
    const user2ObjectId = new Types.ObjectId(user2_id);

    // Tìm private chat giữa 2 users bằng aggregation
    // Tìm chat có đúng 2 participants là user1 và user2
    const existingChat = await this.chatModel.aggregate([
      {
        // Chỉ lấy private chats
        $match: {
          chat_type: ChatType.Private,
          group_id: null,
        },
      },
      {
        // Join với ChatParticipant
        $lookup: {
          from: 'chatparticipants',
          localField: '_id',
          foreignField: 'chat_id',
          as: 'participants',
        },
      },
      {
        // Chỉ lấy chats có đúng 2 participants
        $match: {
          'participants.1': { $exists: true }, // Có ít nhất 2 participants
          'participants.2': { $exists: false }, // Không có participant thứ 3
        },
      },
      {
        // Lọc chat có đúng 2 users
        $match: {
          $and: [
            {
              participants: {
                $elemMatch: { user_id: user1ObjectId },
              },
            },
            {
              participants: {
                $elemMatch: { user_id: user2ObjectId },
              },
            },
          ],
        },
      },
      {
        $limit: 1,
      },
    ]);

    // Nếu tìm thấy chat, trả về
    if (existingChat && existingChat.length > 0) {
      const chat = await this.chatModel.findById(existingChat[0]._id);
      if (!chat) {
        throw new NotFoundException('Chat không tồn tại');
      }
      return chat;
    }

    // Nếu chưa có, tạo mới
    const newChat = await this.chatModel.create({
      chat_type: ChatType.Private,
      group_id: null,
    });

    // Tạo participants
    await this.chatParticipantModel.insertMany([
      { chat_id: newChat._id, user_id: user1ObjectId },
      { chat_id: newChat._id, user_id: user2ObjectId },
    ]);

    return newChat;
  }

  /**
   * Tạo group chat cho một nhóm
   */
  async createGroupChat(
    group_id: string,
    member_ids: string[],
  ): Promise<ChatDocument> {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(group_id)) {
      throw new BadRequestException('Group ID không hợp lệ');
    }

    if (!member_ids || member_ids.length === 0) {
      throw new BadRequestException('Danh sách members không được để trống');
    }

    // Validate all member IDs
    const invalidMemberIds = member_ids.filter(
      (id) => !Types.ObjectId.isValid(id),
    );
    if (invalidMemberIds.length > 0) {
      throw new BadRequestException('Một số member ID không hợp lệ');
    }

    const groupObjectId = new Types.ObjectId(group_id);

    // Kiểm tra group tồn tại
    const group = await this.groupModel.findById(groupObjectId);
    if (!group) {
      throw new NotFoundException('Nhóm không tồn tại');
    }

    // Kiểm tra group đã có chat chưa
    const existingChat = await this.chatModel.findOne({
      chat_type: ChatType.Group,
      group_id: groupObjectId,
    });
    if (existingChat) {
      throw new ConflictException('Nhóm này đã có chat');
    }

    // Validate all members exist
    const members = await this.userModel.find({
      _id: { $in: member_ids.map((id) => new Types.ObjectId(id)) },
    });

    if (members.length !== member_ids.length) {
      throw new NotFoundException('Một số members không tồn tại');
    }

    // Tạo chat
    const newChat = await this.chatModel.create({
      chat_type: ChatType.Group,
      group_id: groupObjectId,
    });

    // Tạo participants
    const participants = member_ids.map((userId) => ({
      chat_id: newChat._id,
      user_id: new Types.ObjectId(userId),
    }));
    await this.chatParticipantModel.insertMany(participants);

    return newChat;
  }

  /**
   * Lấy danh sách chats của user
   * Uses aggregation pipeline to avoid N+1 query problem
   */
  async getUserChats(
    user_id: string,
    chat_type?: ChatType,
  ): Promise<UserChatDetailDto[]> {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(user_id)) {
      throw new BadRequestException('User ID không hợp lệ');
    }

    const userObjectId = new Types.ObjectId(user_id);

    // Use aggregation pipeline to get chats with all details in one query
    const pipeline: any[] = [
      {
        $match: { user_id: userObjectId },
      },
      {
        $lookup: {
          from: 'chats',
          localField: 'chat_id',
          foreignField: '_id',
          as: 'chat',
        },
      },
      {
        $unwind: '$chat',
      },
      ...(chat_type
        ? [
            {
              $match: { 'chat.chat_type': chat_type },
            },
          ]
        : []),
      {
        $lookup: {
          from: 'chatparticipants',
          let: { chatId: '$chat._id' },
          pipeline: [
            {
              $match: { $expr: { $eq: ['$chat_id', '$$chatId'] } },
            },
            {
              $lookup: {
                from: 'users',
                localField: 'user_id',
                foreignField: '_id',
                as: 'user',
              },
            },
            {
              $unwind: { path: '$user', preserveNullAndEmptyArrays: true },
            },
            {
              $project: {
                _id: 1,
                user_id: 1,
                role: 1,
                'user.full_name': 1,
                'user.avatar': 1,
                'user.email': 1,
              },
            },
          ],
          as: 'participants',
        },
      },
      {
        $lookup: {
          from: 'messages',
          localField: 'chat._id',
          foreignField: 'chat_id',
          as: 'lastMessageArray',
          pipeline: [{ $sort: { createdAt: -1 } }, { $limit: 1 }],
        },
      },
      {
        $lookup: {
          from: 'messages',
          let: { chatId: '$chat._id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$chat_id', '$$chatId'] },
                    { $ne: ['$sender_id', userObjectId] },
                    { $ne: ['$status', 'read'] },
                  ],
                },
              },
            },
            { $count: 'count' },
          ],
          as: 'unreadCountArray',
        },
      },
      {
        $lookup: {
          from: 'groups',
          localField: 'chat.group_id',
          foreignField: '_id',
          as: 'groupArray',
        },
      },
      {
        $project: {
          _id: { $toString: '$chat._id' },
          chat_type: '$chat.chat_type',
          group_id: {
            $cond: [
              { $eq: ['$chat.group_id', null] },
              null,
              { $toString: '$chat.group_id' },
            ],
          },
          createdAt: '$chat.createdAt',
          updatedAt: '$chat.updatedAt',
          participants: 1,
          lastMessage: { $arrayElemAt: ['$lastMessageArray', 0] },
          unreadCount: {
            $cond: [
              { $gt: [{ $size: '$unreadCountArray' }, 0] },
              { $arrayElemAt: ['$unreadCountArray.count', 0] },
              0,
            ],
          },
          groupArray: 1,
        },
      },
      {
        $addFields: {
          groupInfo: {
            $cond: [
              { $eq: ['$chat_type', ChatType.Group] },
              {
                $let: {
                  vars: {
                    group: { $arrayElemAt: ['$groupArray', 0] },
                  },
                  in: {
                    _id: { $toString: '$$group._id' },
                    group_name: '$$group.group_name',
                    avatar: '$$group.avatar',
                    meeting_link: '$$group.meeting_link',
                    memberCount: {
                      $cond: [
                        { $isArray: '$$group.members' },
                        { $size: '$$group.members' },
                        0,
                      ],
                    },
                  },
                },
              },
              null,
            ],
          },
        },
      },
    ];

    const result = await this.chatParticipantModel.aggregate(pipeline).exec();

    // Sort by lastMessage time (newest first)
    // Chats without messages will go to the bottom
    result.sort((a, b) => {
      const timeA = a.lastMessage?.createdAt
        ? new Date(a.lastMessage.createdAt).getTime()
        : 0;
      const timeB = b.lastMessage?.createdAt
        ? new Date(b.lastMessage.createdAt).getTime()
        : 0;
      return timeB - timeA; // Descending order (newest first)
    });

    return result as UserChatDetailDto[];
  }

  /**
   * Lấy thông tin chat theo ID
   */
  async getChatById(chat_id: string): Promise<ChatDocument> {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(chat_id)) {
      throw new BadRequestException('Chat ID không hợp lệ');
    }

    const chat = await this.chatModel
      .findById(chat_id)
      .populate('group_id', 'group_name avatar');

    if (!chat) {
      throw new NotFoundException('Chat không tồn tại');
    }

    return chat;
  }

  /**
   * Lấy members của chat
   */
  async getChatMembers(chat_id: string) {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(chat_id)) {
      throw new BadRequestException('Chat ID không hợp lệ');
    }

    const chatObjectId = new Types.ObjectId(chat_id);

    // Check chat exists
    const chat = await this.chatModel.findById(chatObjectId);
    if (!chat) {
      throw new NotFoundException('Chat không tồn tại');
    }

    const participants = await this.chatParticipantModel
      .find({ chat_id: chatObjectId })
      .populate('user_id', 'full_name avatar email')
      .lean();

    return participants.map((p) => ({
      _id: p._id,
      user_id: p.user_id,
      role: p.role,
    }));
  }

  /**
   * Thêm member vào group chat
   */
  async addMemberToChat(chat_id: string, user_id: string) {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(chat_id) || !Types.ObjectId.isValid(user_id)) {
      throw new BadRequestException('Chat ID hoặc User ID không hợp lệ');
    }

    const chatObjectId = new Types.ObjectId(chat_id);
    const userObjectId = new Types.ObjectId(user_id);

    // Check user exists
    const user = await this.userModel.findById(userObjectId).lean();
    if (!user) {
      throw new NotFoundException('User không tồn tại');
    }

    // Kiểm tra chat
    const chat = await this.chatModel.findById(chatObjectId);
    if (!chat) {
      throw new NotFoundException('Chat không tồn tại');
    }

    if (chat.chat_type !== ChatType.Group) {
      throw new BadRequestException('Chỉ có thể thêm member vào group chat');
    }

    // Kiểm tra đã là member chưa
    const existing = await this.chatParticipantModel.findOne({
      chat_id: chatObjectId,
      user_id: userObjectId,
    });

    if (existing) {
      throw new ConflictException('User đã là member của chat');
    }

    // Thêm participant
    const result = await this.chatParticipantModel.create({
      chat_id: chatObjectId,
      user_id: userObjectId,
    });

    return {
      _id: result._id,
      chat_id: result.chat_id,
      user_id: result.user_id,
      role: result.role,
    };
  }

  /**
   * Xóa member khỏi group chat
   */
  async removeMemberFromChat(chat_id: string, user_id: string) {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(chat_id) || !Types.ObjectId.isValid(user_id)) {
      throw new BadRequestException('Chat ID hoặc User ID không hợp lệ');
    }

    const chatObjectId = new Types.ObjectId(chat_id);
    const userObjectId = new Types.ObjectId(user_id);

    // Check chat exists and is group chat
    const chat = await this.chatModel.findById(chatObjectId);
    if (!chat) {
      throw new NotFoundException('Chat không tồn tại');
    }

    if (chat.chat_type !== ChatType.Group) {
      throw new BadRequestException('Chỉ có thể xóa member khỏi group chat');
    }

    const result = await this.chatParticipantModel.deleteOne({
      chat_id: chatObjectId,
      user_id: userObjectId,
    });

    if (result.deletedCount === 0) {
      throw new NotFoundException('User không phải member của chat');
    }

    return {
      message: 'Xóa member khỏi chat thành công',
      deletedCount: result.deletedCount,
    };
  }

  /**
   * Tìm group chat theo group_id
   * Helper method for finding chat group by study group ID
   */
  async findGroupChatByGroupId(group_id: string): Promise<ChatDocument | null> {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(group_id)) {
      throw new BadRequestException('Group ID không hợp lệ');
    }

    const groupObjectId = new Types.ObjectId(group_id);

    const chat = await this.chatModel.findOne({
      chat_type: ChatType.Group,
      group_id: groupObjectId,
    });

    return chat || null;
  }

  /**
   * Xóa group chat và tất cả dữ liệu liên quan (participants, messages)
   * Called when a study group is deleted
   */
  async deleteGroupChat(group_id: string): Promise<{ message: string }> {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(group_id)) {
      throw new BadRequestException('Group ID không hợp lệ');
    }

    const groupObjectId = new Types.ObjectId(group_id);

    // Find the group chat
    const chat = await this.chatModel.findOne({
      chat_type: ChatType.Group,
      group_id: groupObjectId,
    });

    if (!chat) {
      // Group chat doesn't exist, nothing to delete
      return { message: 'Không tìm thấy chat nhóm để xóa' };
    }

    const chatObjectId = chat._id as Types.ObjectId;

    // Delete all messages in this chat
    await this.messageModel.deleteMany({ chat_id: chatObjectId });

    // Delete all participants in this chat
    await this.chatParticipantModel.deleteMany({ chat_id: chatObjectId });

    // Delete the chat itself
    await this.chatModel.findByIdAndDelete(chatObjectId);

    return { message: 'Xóa chat nhóm và tất cả dữ liệu liên quan thành công' };
  }
}
