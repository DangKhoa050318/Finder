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

/**
 * Gateway riêng cho notifications real-time
 * Namespace: /notifications
 */
@WebSocketGateway({
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  },
  namespace: '/notifications',
  transports: ['websocket', 'polling'],
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);
  private userSockets: Map<string, string> = new Map(); // userId -> socketId

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.userSockets.set(userId, client.id);
      client.join(`user_${userId}`); // Join room riêng của user
      this.logger.log(
        `🔔 User ${userId} connected to notifications with socket ${client.id}`,
      );
    } else {
      this.logger.warn(
        `❌ Client ${client.id} connected to notifications without userId`,
      );
    }
  }

  handleDisconnect(client: Socket) {
    const userId = Array.from(this.userSockets.entries()).find(
      ([, socketId]) => socketId === client.id,
    )?.[0];
    if (userId) {
      this.userSockets.delete(userId);
      this.logger.log(`❌ User ${userId} disconnected from notifications`);
    }
  }

  /**
   * Client subscribe vào notifications
   */
  @SubscribeMessage('subscribeNotifications')
  handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    const { userId } = data;
    client.join(`user_${userId}`);
    this.logger.log(
      `📥 Socket ${client.id} subscribed to user ${userId} notifications`,
    );
    return { event: 'subscribed', data: { userId } };
  }

  /**
   * Client unsubscribe khỏi notifications
   */
  @SubscribeMessage('unsubscribeNotifications')
  handleUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    const { userId } = data;
    client.leave(`user_${userId}`);
    this.logger.log(
      `📤 Socket ${client.id} unsubscribed from user ${userId} notifications`,
    );
    return { event: 'unsubscribed', data: { userId } };
  }

  /**
   * Mark notification as read (client -> server)
   */
  @SubscribeMessage('markNotificationRead')
  handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { notificationId: string },
  ) {
    // Có thể call NotificationService để update DB
    this.logger.log(`✅ Notification ${data.notificationId} marked as read`);
    return { event: 'notificationRead', data };
  }

  /**
   * Gửi notification đến một user cụ thể
   * Called từ NotificationService
   */
  sendNotificationToUser(userId: string, notification: any) {
    this.server.to(`user_${userId}`).emit('newNotification', notification);
    this.logger.log(
      `🔔 Sent notification to user ${userId}: ${notification.type}`,
    );
  }

  /**
   * Gửi notification đến nhiều users
   */
  sendNotificationToUsers(userIds: string[], notification: any) {
    userIds.forEach((userId) => {
      this.sendNotificationToUser(userId, notification);
    });
    this.logger.log(
      `🔔 Sent notification to ${userIds.length} users: ${notification.type}`,
    );
  }

  /**
   * Broadcast notification đến tất cả connected users
   */
  broadcastNotification(notification: any) {
    this.server.emit('newNotification', notification);
    this.logger.log(`📢 Broadcasted notification: ${notification.type}`);
  }

  /**
   * Thông báo notification count đã thay đổi
   */
  sendUnreadCountUpdate(userId: string, unreadCount: number) {
    this.server.to(`user_${userId}`).emit('unreadCountUpdate', { unreadCount });
    this.logger.log(
      `🔢 Updated unread count for user ${userId}: ${unreadCount}`,
    );
  }
}
