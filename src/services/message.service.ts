import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Get,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Message,
  MessageDocument,
  MessageStatus,
} from '../models/message.schema';
import {
  ChatParticipant,
  ChatParticipantDocument,
} from '../models/chat-participant.schema';
import { SendMessageDto, GetMessagesQueryDto } from '../dtos/message.dto';
import { ApiOperation } from '@nestjs/swagger';
import { BlockService } from './block.service';

@Injectable()
export class MessageService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(ChatParticipant.name)
    private chatParticipantModel: Model<ChatParticipantDocument>,
    @Inject(forwardRef(() => BlockService))
    private blockService: BlockService,
  ) {}

  /**
   * Gửi message
   */
  async sendMessage(dto: SendMessageDto): Promise<MessageDocument> {
    const chatObjectId = new Types.ObjectId(dto.chat_id);
    const senderObjectId = new Types.ObjectId(dto.sender_id);

    // Kiểm tra sender có phải member của chat không
    const isParticipant = await this.chatParticipantModel.findOne({
      chat_id: chatObjectId,
      user_id: senderObjectId,
    });

    if (!isParticipant) {
      throw new ForbiddenException('Bạn không phải là thành viên của chat này');
    }

    // Kiểm tra xem có block giữa sender và các recipients không
    // Lấy danh sách participants của chat
    const participants = await this.chatParticipantModel.find({
      chat_id: chatObjectId,
      user_id: { $ne: senderObjectId },
    });

    // Kiểm tra xem sender có bị chặn bởi bất kỳ recipient nào không
    for (const participant of participants) {
      const isBlocked = await this.blockService.hasBlockBetween(
        dto.sender_id,
        participant.user_id.toString(),
      );
      if (isBlocked) {
        throw new ForbiddenException(
          'Bạn không thể gửi tin nhắn vì bị chặn hoặc đã chặn người nhận',
        );
      }
    }

    // Tạo message
    const message = await this.messageModel.create({
      chat_id: chatObjectId,
      sender_id: senderObjectId,
      content: dto.content,
      status: MessageStatus.Sent,
    });
    await message.populate('sender_id', 'full_name avatar email');

    return message;
  }

  /**
   * Lấy messages của chat với cursor-based pagination
   * Nếu có before_id, lấy những messages cũ hơn (createdAt < message với before_id)
   */
  async getMessages(dto: GetMessagesQueryDto): Promise<MessageDocument[]> {
    const chatObjectId = new Types.ObjectId(dto.chat_id);
    const limit = dto.limit || 50;

    let query: any = { chat_id: chatObjectId };

    // Nếu có before_id (cursor), lấy những messages cũ hơn
    if (dto.before_id && Types.ObjectId.isValid(dto.before_id)) {
      const beforeMessage = await this.messageModel.findById(dto.before_id);
      if (beforeMessage) {
        query.createdAt = { $lt: (beforeMessage as any).createdAt };
      }
    }

    const messages = await this.messageModel
      .find(query)
      .sort({ createdAt: -1 }) // Mới nhất trước
      .limit(limit)
      .populate('sender_id', 'full_name avatar email');

    // Reverse để messages cũ nhất trước (chronological order)
    return messages.reverse();
  }

  /**
   * Lấy message theo ID
   */
  async getMessageById(message_id: string): Promise<MessageDocument> {
    const message = await this.messageModel
      .findById(message_id)
      .populate('sender_id', 'full_name avatar email');
    if (!message) {
      throw new NotFoundException('Message không tồn tại');
    }
    return message;
  }

  /**
   * Đánh dấu messages là đã đọc
   */
  async markMessagesAsRead(
    chat_id: string,
    user_id: string,
  ): Promise<{ modifiedCount: number }> {
    const chatObjectId = new Types.ObjectId(chat_id);
    const userObjectId = new Types.ObjectId(user_id);

    // Kiểm tra user có phải member không
    const isParticipant = await this.chatParticipantModel.findOne({
      chat_id: chatObjectId,
      user_id: userObjectId,
    });

    if (!isParticipant) {
      throw new ForbiddenException('Bạn không phải là thành viên của chat này');
    }

    // Update messages không phải của user và chưa đọc
    const result = await this.messageModel.updateMany(
      {
        chat_id: chatObjectId,
        sender_id: { $ne: userObjectId },
        status: { $ne: MessageStatus.Read },
      },
      { status: MessageStatus.Read },
    );

    // Update last_seen_at của participant
    await this.chatParticipantModel.updateOne(
      { chat_id: chatObjectId, user_id: userObjectId },
      { last_seen_at: new Date() },
    );

    return { modifiedCount: result.modifiedCount };
  }

  /**
   * Đếm số messages chưa đọc của user trong chat
   */
  async getUnreadCount(chat_id: string, user_id: string): Promise<number> {
    const chatObjectId = new Types.ObjectId(chat_id);
    const userObjectId = new Types.ObjectId(user_id);

    const count = await this.messageModel.countDocuments({
      chat_id: chatObjectId,
      sender_id: { $ne: userObjectId },
      status: { $ne: MessageStatus.Read },
    });

    return count;
  }

  /**
   * Đếm tất cả messages chưa đọc của user (across all chats)
   */
  async getTotalUnreadCount(user_id: string): Promise<number> {
    const userObjectId = new Types.ObjectId(user_id);

    // Lấy tất cả chat_ids mà user tham gia
    const participants = await this.chatParticipantModel
      .find({ user_id: userObjectId })
      .select('chat_id');

    const chatIds = participants.map((p) => p.chat_id);

    // Đếm messages chưa đọc trong các chats đó
    const count = await this.messageModel.countDocuments({
      chat_id: { $in: chatIds },
      sender_id: { $ne: userObjectId },
      status: { $ne: MessageStatus.Read },
    });

    return count;
  }

  /**
   * Xóa message (soft delete - có thể set deleted flag hoặc hard delete)
   */
  async deleteMessage(message_id: string, user_id: string) {
    const messageObjectId = new Types.ObjectId(message_id);
    const userObjectId = new Types.ObjectId(user_id);

    const message = await this.messageModel.findById(messageObjectId);
    if (!message) {
      throw new NotFoundException('Message không tồn tại');
    }

    // Chỉ sender mới có thể xóa message của mình
    if (message.sender_id.toString() !== user_id) {
      throw new ForbiddenException('Bạn chỉ có thể xóa message của mình');
    }

    await this.messageModel.deleteOne({ _id: messageObjectId });
    return { message: 'Đã xóa message thành công' };
  }

  /**
   * Lấy message cuối cùng của chat (để hiển thị preview)
   */
  async getLastMessage(chat_id: string): Promise<MessageDocument | null> {
    const chatObjectId = new Types.ObjectId(chat_id);
    const message = await this.messageModel
      .findOne({ chat_id: chatObjectId })
      .sort({ created_at: -1 })
      .populate('sender_id', 'full_name');

    return message;
  }
}
