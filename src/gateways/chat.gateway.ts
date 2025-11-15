import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { MessageService } from '../services/message.service';
import { BlockService } from '../services/block.service';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000'], // Frontend URLs
    credentials: true,
  },
  namespace: '/chat', // Namespace riêng cho chat
  transports: ['websocket', 'polling'],
})

export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private userSockets: Map<string, string> = new Map(); // userId -> socketId

  constructor(
    private readonly messageService: MessageService,
    @Inject(forwardRef(() => BlockService))
    private readonly blockService: BlockService,
  ) {}

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.userSockets.set(userId, client.id);
      client.join(`user_${userId}`); // Join room riêng của user
      this.logger.log(`⚡ User ${userId} connected with socket ${client.id}`);
    } else {
      this.logger.warn(`❌ Client ${client.id} connected without userId`);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = Array.from(this.userSockets.entries()).find(
      ([, socketId]) => socketId === client.id,
    )?.[0];
    if (userId) {
      this.userSockets.delete(userId);
      this.logger.log(`❌ User ${userId} disconnected`);
    }
  }

  /**
   * Client join vào room của một chat
   */
  @SubscribeMessage('joinChat')
  async handleJoinChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chat_id: string; user_id: string },
  ) {
    const chatId = data.chat_id;
    const userId = data.user_id;
    
    client.join(`chat_${chatId}`);
    this.logger.log(`📥 Socket ${client.id} joined chat ${chatId}`);

    // Fetch và gửi lại các messages hiện có trong chat cho user này
    try {
      const messages = await this.messageService.getMessages({
        chat_id: chatId,
        limit: 50, // Load 50 messages gần nhất
      });

      client.emit('chatHistory', {
        chatId,
        messages: messages,
      });

      this.logger.log(
        `📜 Sent ${messages.length} historical messages to socket ${client.id}`,
      );
    } catch (error) {
      this.logger.error(`❌ Error fetching chat history: ${error.message}`);
    }

    return { event: 'joinedChat', data: { chatId } };
  }

  /**
   * Kiểm tra trạng thái block giữa 2 users
   */
  @SubscribeMessage('checkBlockStatus')
  async handleCheckBlockStatus(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { user_id: string; other_user_id: string },
  ) {
    try {
      const hasBlock = await this.blockService.hasBlockBetween(
        data.user_id,
        data.other_user_id,
      );

      // Gửi block status về client
      client.emit('blockStatusUpdated', {
        userId: data.user_id,
        otherUserId: data.other_user_id,
        isBlocked: hasBlock,
      });

      this.logger.log(
        `🔒 Block status checked between ${data.user_id} and ${data.other_user_id}: ${hasBlock}`,
      );

      return {
        event: 'blockStatusChecked',
        data: { isBlocked: hasBlock },
      };
    } catch (error) {
      this.logger.error(`❌ Error checking block status: ${error.message}`);
      client.emit('error', {
        message: 'Không thể kiểm tra trạng thái chặn',
      });
    }
  }

  /**
   * Notify khi có user block/unblock
   */
  notifyBlockStatusChanged(
    blockerId: string,
    blockedId: string,
    action: 'blocked' | 'unblocked',
  ) {
    // Gửi đến cả 2 users
    this.server.to(`user_${blockerId}`).emit('blockStatusChanged', {
      action,
      userId: blockedId,
      isBlocker: true,
    });

    this.server.to(`user_${blockedId}`).emit('blockStatusChanged', {
      action,
      userId: blockerId,
      isBlocker: false,
    });

    this.logger.log(
      `🔒 Notified block status changed: ${blockerId} ${action} ${blockedId}`,
    );
  }

  /**
   * Client leave room của chat
   */
  @SubscribeMessage('leaveChat')
  handleLeaveChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() chatId: string,
  ) {
    client.leave(`chat_${chatId}`);
    this.logger.log(`📤 Socket ${client.id} left chat ${chatId}`);
    return { event: 'leftChat', data: { chatId } };
  }

  /**
   * Client báo đang typing
   */
  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string; userId: string; userName: string },
  ) {
    client.to(`chat_${data.chatId}`).emit('userTyping', {
      userId: data.userId,
      userName: data.userName,
    });
  }

  /**
   * Client báo đã stop typing
   */
  @SubscribeMessage('stopTyping')
  handleStopTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string; userId: string },
  ) {
    client.to(`chat_${data.chatId}`).emit('userStoppedTyping', {
      userId: data.userId,
    });
  }

  /**
   * Gửi tin nhắn mới đến tất cả members trong chat
   */
  sendNewMessage(chatId: string, message: any, members?: any[]) {
    // Emit đến chat room (cho users đang mở chat đó)
    this.server.to(`chat_${chatId}`).emit('newMessage', message);
    
    // Emit đến user rooms của tất cả members (để cập nhật danh sách chat real-time)
    if (members && members.length > 0) {
      members.forEach(member => {
        const userId = member.user_id?._id?.toString() || member.user_id?.toString();
        if (userId) {
          this.server.to(`user_${userId}`).emit('newMessage', message);
          this.logger.log(`� Sent message to user ${userId}`);
        }
      });
    }
    
    this.logger.log(`�💬 Sent message to chat ${chatId} and ${members?.length || 0} users`);
  }

  /**
   * Thông báo message đã được seen
   */
  sendMessageSeen(chatId: string, data: { messageId: string; userId: string }) {
    this.server.to(`chat_${chatId}`).emit('messageSeen', data);
  }

  /**
   * Thông báo chat đã được update (tên, avatar, members...)
   */
  sendChatUpdated(chatId: string, chat: any) {
    this.server.to(`chat_${chatId}`).emit('chatUpdated', chat);
  }

  /**
   * Gửi notification đến user cụ thể
   */
  sendNotificationToUser(userId: string, notification: any) {
    this.server.to(`user_${userId}`).emit('notification', notification);
  }
}
