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

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
    @InjectModel(ChatParticipant.name)
    private chatParticipantModel: Model<ChatParticipantDocument>,
    @InjectModel(Group.name) private groupModel: Model<GroupDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
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

    const user1ObjectId = new Types.ObjectId(user1_id);
    const user2ObjectId = new Types.ObjectId(user2_id);

    // Tìm chat participants của cả 2 users
    const [user1Chats, user2Chats] = await Promise.all([
      this.chatParticipantModel
        .find({ user_id: user1ObjectId })
        .select('chat_id'),
      this.chatParticipantModel
        .find({ user_id: user2ObjectId })
        .select('chat_id'),
    ]);

    // Tìm chat_id chung
    const user1ChatIds = user1Chats.map((p) => p.chat_id.toString());
    const user2ChatIds = user2Chats.map((p) => p.chat_id.toString());
    const commonChatIds = user1ChatIds.filter((id) =>
      user2ChatIds.includes(id),
    );

    // Kiểm tra xem có private chat nào giữa 2 users không
    for (const chatId of commonChatIds) {
      const chat = await this.chatModel.findById(chatId);
      if (chat && chat.chat_type === ChatType.Private) {
        // Kiểm tra chat này chỉ có 2 members
        const participantCount = await this.chatParticipantModel.countDocuments(
          { chat_id: chat._id },
        );
        if (participantCount === 2) {
          return chat;
        }
      }
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
   */
  async getUserChats(
    user_id: string,
    chat_type?: ChatType,
  ): Promise<ChatDocument[]> {
    const userObjectId = new Types.ObjectId(user_id);

    // Lấy chat_ids mà user tham gia
    const participants = await this.chatParticipantModel
      .find({ user_id: userObjectId })
      .select('chat_id');

    const chatIds = participants.map((p) => p.chat_id);

    // Query chats
    const query: any = { _id: { $in: chatIds } };
    if (chat_type) {
      query.chat_type = chat_type;
    }

    const chats = await this.chatModel
      .find(query)
      .sort({ updated_at: -1 })
      .populate('group_id', 'name avatar');

    return chats;
  }

  /**
   * Lấy thông tin chat theo ID
   */
  async getChatById(chat_id: string): Promise<ChatDocument> {
    const chat = await this.chatModel
      .findById(chat_id)
      .populate('group_id', 'name avatar');
    if (!chat) {
      throw new NotFoundException('Chat không tồn tại');
    }
    return chat;
  }

  /**
   * Lấy members của chat
   */
  async getChatMembers(chat_id: string) {
    const chatObjectId = new Types.ObjectId(chat_id);
    const participants = await this.chatParticipantModel
      .find({ chat_id: chatObjectId })
      .populate('user_id', 'full_name avatar email');
    return participants.map((p) => p.user_id);
  }

  /**
   * Thêm member vào group chat
   */
  async addMemberToChat(chat_id: string, user_id: string) {
    const chatObjectId = new Types.ObjectId(chat_id);
    const userObjectId = new Types.ObjectId(user_id);

    // Kiểm tra chat
    const chat = await this.chatModel.findById(chatObjectId);
    if (!chat) {
      throw new NotFoundException('Chat không tồn tại');
    }
    if (chat.chat_type !== ChatType.Group) {
      throw new BadRequestException(
        'Chỉ có thể thêm member vào group chat',
      );
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
    await this.chatParticipantModel.create({
      chat_id: chatObjectId,
      user_id: userObjectId,
    });

    return { message: 'Đã thêm member vào chat thành công' };
  }

  /**
   * Xóa member khỏi group chat
   */
  async removeMemberFromChat(chat_id: string, user_id: string) {
    const chatObjectId = new Types.ObjectId(chat_id);
    const userObjectId = new Types.ObjectId(user_id);

    const result = await this.chatParticipantModel.deleteOne({
      chat_id: chatObjectId,
      user_id: userObjectId,
    });

    if (result.deletedCount === 0) {
      throw new NotFoundException('User không phải member của chat');
    }

    return { message: 'Đã xóa member khỏi chat thành công' };
  }

  /**
   * Update thời gian updated_at của chat (khi có message mới)
   */
  async updateChatTimestamp(chat_id: string) {
    await this.chatModel.findByIdAndUpdate(chat_id, {
      updated_at: new Date(),
    });
  }
}
