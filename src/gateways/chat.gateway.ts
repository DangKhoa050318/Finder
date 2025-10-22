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
import { Logger } from '@nestjs/common';
import { MessageService } from '../services/message.service';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000'], // Frontend URLs
    credentials: true,
  },
  namespace: '/chat', // Namespace riêng cho chat
  transports: ['websocket', 'polling'],
})
export class ChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private userSockets: Map<string, string> = new Map(); // userId -> socketId

  constructor(private readonly messageService: MessageService) {}

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
    @MessageBody() data: { chat_id: string },
  ) {
    const chatId = data.chat_id;
    client.join(`chat_${chatId}`);
    this.logger.log(`📥 Socket ${client.id} joined chat ${chatId}`);

    // Fetch và gửi lại các messages hiện có trong chat cho user này
    try {
      const messages = await this.messageService.getMessages({
        chat_id: chatId,
        limit: 50, // Load 50 messages gần nhất
      });
      
      // Gửi messages history về cho client vừa join
      client.emit('chatHistory', {
        chatId,
        messages: messages,
      });
      
      this.logger.log(`📜 Sent ${messages.length} historical messages to socket ${client.id}`);
    } catch (error) {
      this.logger.error(`❌ Error fetching chat history: ${error.message}`);
    }

    return { event: 'joinedChat', data: { chatId } };
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
  sendNewMessage(chatId: string, message: any) {
    this.server.to(`chat_${chatId}`).emit('newMessage', message);
    this.logger.log(`💬 Sent message to chat ${chatId}`);
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
