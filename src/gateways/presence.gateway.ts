import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  UserPresence,
  UserPresenceDocument,
  PresenceStatus,
  ActivityType,
} from '../models/user-presence.schema';
import {
  TypingIndicator,
  TypingIndicatorDocument,
  TypingContext,
} from '../models/typing-indicator.schema';
import {
  EditLock,
  EditLockDocument,
  LockType,
} from '../models/edit-lock.schema';

@Injectable()
@WebSocketGateway({
  namespace: 'presence',
  cors: { origin: '*' },
})
export class PresenceGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(PresenceGateway.name);

  constructor(
    @InjectModel(UserPresence.name)
    private userPresenceModel: Model<UserPresenceDocument>,
    @InjectModel(TypingIndicator.name)
    private typingIndicatorModel: Model<TypingIndicatorDocument>,
    @InjectModel(EditLock.name)
    private editLockModel: Model<EditLockDocument>,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const userId = client.handshake.query.userId as string;
      if (!userId) {
        client.disconnect();
        return;
      }

      this.logger.log(`👤 User ${userId} connected to presence with socket ${client.id}`);

      // Join user's personal room
      client.join(`user_${userId}`);

      // Update or create presence
      await this.setUserOnline(userId, client.id, client.handshake);

      // Broadcast presence update
      this.broadcastPresenceUpdate(userId, PresenceStatus.Online, true);
    } catch (error) {
      this.logger.error('Error handling connection:', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    try {
      const userId = client.handshake.query.userId as string;
      if (!userId) return;

      this.logger.log(`👤 User ${userId} disconnected socket ${client.id}`);

      // Remove socket ID and check if user has other connections
      const presence = await this.removeSocketId(userId, client.id);

      if (presence && presence.socket_ids.length === 0) {
        // No more active connections - set offline
        await this.setUserOffline(userId);
        this.broadcastPresenceUpdate(userId, PresenceStatus.Offline, false);
      }

      // Release any edit locks held by this socket
      await this.releaseEditLocksBySocket(client.id);

      // Clear typing indicators
      await this.typingIndicatorModel.deleteMany({ user_id: new Types.ObjectId(userId) });
    } catch (error) {
      this.logger.error('Error handling disconnect:', error);
    }
  }

  // ==================== PRESENCE MANAGEMENT ====================

  @SubscribeMessage('updateStatus')
  async handleUpdateStatus(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { status: PresenceStatus; customMessage?: string },
  ) {
    try {
      const userId = client.handshake.query.userId as string;
      if (!userId) return;

      const presence = await this.userPresenceModel.findOneAndUpdate(
        { user_id: new Types.ObjectId(userId) },
        {
          status: data.status,
          custom_status_message: data.customMessage || null,
          away_since: data.status === PresenceStatus.Away ? new Date() : null,
          last_seen: new Date(),
        },
        { new: true, upsert: true },
      );

      this.broadcastPresenceUpdate(userId, data.status, presence.is_online);

      client.emit('statusUpdated', { success: true, status: data.status });
    } catch (error) {
      this.logger.error('Error updating status:', error);
      client.emit('error', { message: 'Failed to update status' });
    }
  }

  @SubscribeMessage('updateActivity')
  async handleUpdateActivity(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { activity: ActivityType; resourceId?: string },
  ) {
    try {
      const userId = client.handshake.query.userId as string;
      if (!userId) return;

      await this.userPresenceModel.findOneAndUpdate(
        { user_id: new Types.ObjectId(userId) },
        {
          current_activity: data.activity,
          current_resource_id: data.resourceId
            ? new Types.ObjectId(data.resourceId)
            : null,
          last_seen: new Date(),
        },
        { upsert: true },
      );

      // Broadcast to users viewing same resource
      if (data.resourceId) {
        this.server.to(`resource_${data.resourceId}`).emit('userActivity', {
          userId,
          activity: data.activity,
          resourceId: data.resourceId,
        });
      }

      client.emit('activityUpdated', { success: true });
    } catch (error) {
      this.logger.error('Error updating activity:', error);
    }
  }

  @SubscribeMessage('subscribeToResource')
  async handleSubscribeToResource(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { resourceId: string; resourceType: string },
  ) {
    try {
      client.join(`resource_${data.resourceId}`);

      // Get users currently viewing this resource
      const activeUsers = await this.getActiveUsersForResource(data.resourceId);

      client.emit('resourceUsers', {
        resourceId: data.resourceId,
        users: activeUsers,
      });
    } catch (error) {
      this.logger.error('Error subscribing to resource:', error);
    }
  }

  @SubscribeMessage('unsubscribeFromResource')
  async handleUnsubscribeFromResource(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { resourceId: string },
  ) {
    client.leave(`resource_${data.resourceId}`);
  }

  @SubscribeMessage('getOnlineUsers')
  async handleGetOnlineUsers(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userIds?: string[] },
  ) {
    try {
      const filter: any = { is_online: true };
      if (data.userIds && data.userIds.length > 0) {
        filter.user_id = { $in: data.userIds.map((id) => new Types.ObjectId(id)) };
      }

      const onlineUsers = await this.userPresenceModel
        .find(filter)
        .populate('user_id', 'full_name avatar email')
        .lean();

      client.emit('onlineUsers', { users: onlineUsers });
    } catch (error) {
      this.logger.error('Error getting online users:', error);
    }
  }

  // ==================== TYPING INDICATORS ====================

  @SubscribeMessage('startTyping')
  async handleStartTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { context: TypingContext; resourceId: string },
  ) {
    try {
      const userId = client.handshake.query.userId as string;
      if (!userId) return;

      // Upsert typing indicator with 5-second expiry
      await this.typingIndicatorModel.findOneAndUpdate(
        {
          user_id: new Types.ObjectId(userId),
          context: data.context,
          resource_id: new Types.ObjectId(data.resourceId),
        },
        {
          started_at: new Date(),
          expires_at: new Date(Date.now() + 5000),
        },
        { upsert: true, new: true },
      );

      // Broadcast to others viewing same resource
      client.to(`resource_${data.resourceId}`).emit('userTyping', {
        userId,
        context: data.context,
        resourceId: data.resourceId,
      });
    } catch (error) {
      this.logger.error('Error handling start typing:', error);
    }
  }

  @SubscribeMessage('stopTyping')
  async handleStopTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { context: TypingContext; resourceId: string },
  ) {
    try {
      const userId = client.handshake.query.userId as string;
      if (!userId) return;

      await this.typingIndicatorModel.deleteOne({
        user_id: new Types.ObjectId(userId),
        context: data.context,
        resource_id: new Types.ObjectId(data.resourceId),
      });

      // Broadcast stop typing
      client.to(`resource_${data.resourceId}`).emit('userStoppedTyping', {
        userId,
        context: data.context,
        resourceId: data.resourceId,
      });
    } catch (error) {
      this.logger.error('Error handling stop typing:', error);
    }
  }

  @SubscribeMessage('getTypingUsers')
  async handleGetTypingUsers(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { context: TypingContext; resourceId: string },
  ) {
    try {
      const typingUsers = await this.typingIndicatorModel
        .find({
          context: data.context,
          resource_id: new Types.ObjectId(data.resourceId),
          expires_at: { $gt: new Date() },
        })
        .populate('user_id', 'full_name avatar')
        .lean();

      client.emit('typingUsers', {
        context: data.context,
        resourceId: data.resourceId,
        users: typingUsers,
      });
    } catch (error) {
      this.logger.error('Error getting typing users:', error);
    }
  }

  // ==================== EDIT LOCKS ====================

  @SubscribeMessage('requestEditLock')
  async handleRequestEditLock(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { lockType: LockType; resourceId: string },
  ) {
    try {
      const userId = client.handshake.query.userId as string;
      if (!userId) return;

      // Check if resource is already locked by someone else
      const existingLock = await this.editLockModel.findOne({
        lock_type: data.lockType,
        resource_id: new Types.ObjectId(data.resourceId),
        is_active: true,
        expires_at: { $gt: new Date() },
      });

      if (existingLock && existingLock.locked_by.toString() !== userId) {
        client.emit('editLockDenied', {
          resourceId: data.resourceId,
          lockedBy: existingLock.locked_by,
          lockedAt: existingLock.locked_at,
          expiresAt: existingLock.expires_at,
        });
        return;
      }

      // Grant lock
      const lock = await this.editLockModel.findOneAndUpdate(
        {
          lock_type: data.lockType,
          resource_id: new Types.ObjectId(data.resourceId),
        },
        {
          locked_by: new Types.ObjectId(userId),
          locked_at: new Date(),
          expires_at: new Date(Date.now() + 300000), // 5 minutes
          socket_id: client.id,
          is_active: true,
        },
        { upsert: true, new: true },
      );

      client.emit('editLockGranted', {
        lockId: lock._id,
        resourceId: data.resourceId,
        expiresAt: lock.expires_at,
      });

      // Notify others viewing this resource
      client.to(`resource_${data.resourceId}`).emit('resourceLocked', {
        resourceId: data.resourceId,
        lockedBy: userId,
        lockType: data.lockType,
      });
    } catch (error) {
      this.logger.error('Error requesting edit lock:', error);
      client.emit('error', { message: 'Failed to request edit lock' });
    }
  }

  @SubscribeMessage('releaseEditLock')
  async handleReleaseEditLock(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { lockType: LockType; resourceId: string },
  ) {
    try {
      const userId = client.handshake.query.userId as string;
      if (!userId) return;

      await this.editLockModel.findOneAndUpdate(
        {
          lock_type: data.lockType,
          resource_id: new Types.ObjectId(data.resourceId),
          locked_by: new Types.ObjectId(userId),
        },
        { is_active: false },
      );

      client.emit('editLockReleased', { resourceId: data.resourceId });

      // Notify others
      client.to(`resource_${data.resourceId}`).emit('resourceUnlocked', {
        resourceId: data.resourceId,
        lockType: data.lockType,
      });
    } catch (error) {
      this.logger.error('Error releasing edit lock:', error);
    }
  }

  @SubscribeMessage('renewEditLock')
  async handleRenewEditLock(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { lockType: LockType; resourceId: string },
  ) {
    try {
      const userId = client.handshake.query.userId as string;
      if (!userId) return;

      const lock = await this.editLockModel.findOneAndUpdate(
        {
          lock_type: data.lockType,
          resource_id: new Types.ObjectId(data.resourceId),
          locked_by: new Types.ObjectId(userId),
          is_active: true,
        },
        { expires_at: new Date(Date.now() + 300000) }, // Extend 5 more minutes
        { new: true },
      );

      if (lock) {
        client.emit('editLockRenewed', {
          resourceId: data.resourceId,
          expiresAt: lock.expires_at,
        });
      } else {
        client.emit('editLockExpired', { resourceId: data.resourceId });
      }
    } catch (error) {
      this.logger.error('Error renewing edit lock:', error);
    }
  }

  // ==================== HELPER METHODS ====================

  private async setUserOnline(
    userId: string,
    socketId: string,
    handshake: any,
  ) {
    const deviceInfo = {
      platform: handshake.headers['user-agent'] || 'unknown',
      browser: this.extractBrowser(handshake.headers['user-agent']),
      is_mobile: /mobile/i.test(handshake.headers['user-agent']),
    };

    await this.userPresenceModel.findOneAndUpdate(
      { user_id: new Types.ObjectId(userId) },
      {
        $set: {
          status: PresenceStatus.Online,
          is_online: true,
          last_seen: new Date(),
          device_info: deviceInfo,
        },
        $addToSet: { socket_ids: socketId },
      },
      { upsert: true, new: true },
    );
  }

  private async setUserOffline(userId: string) {
    await this.userPresenceModel.findOneAndUpdate(
      { user_id: new Types.ObjectId(userId) },
      {
        status: PresenceStatus.Offline,
        is_online: false,
        last_seen: new Date(),
        current_activity: ActivityType.Idle,
        current_resource_id: null,
        socket_ids: [],
      },
    );
  }

  private async removeSocketId(userId: string, socketId: string) {
    return this.userPresenceModel.findOneAndUpdate(
      { user_id: new Types.ObjectId(userId) },
      {
        $pull: { socket_ids: socketId },
        $set: { last_seen: new Date() },
      },
      { new: true },
    );
  }

  private broadcastPresenceUpdate(
    userId: string,
    status: PresenceStatus,
    isOnline: boolean,
  ) {
    this.server.emit('presenceUpdate', {
      userId,
      status,
      isOnline,
      timestamp: new Date(),
    });
  }

  private async getActiveUsersForResource(resourceId: string) {
    return this.userPresenceModel
      .find({
        current_resource_id: new Types.ObjectId(resourceId),
        is_online: true,
      })
      .populate('user_id', 'full_name avatar email')
      .select('user_id status current_activity last_seen')
      .lean();
  }

  private async releaseEditLocksBySocket(socketId: string) {
    await this.editLockModel.updateMany(
      { socket_id: socketId, is_active: true },
      { is_active: false },
    );
  }

  private extractBrowser(userAgent: string): string {
    if (!userAgent) return 'unknown';
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Other';
  }

  // Public method for other services to update presence
  public async updateUserActivity(
    userId: string,
    activity: ActivityType,
    resourceId?: string,
  ) {
    await this.userPresenceModel.findOneAndUpdate(
      { user_id: new Types.ObjectId(userId) },
      {
        current_activity: activity,
        current_resource_id: resourceId
          ? new Types.ObjectId(resourceId)
          : null,
        last_seen: new Date(),
      },
      { upsert: true },
    );

    if (resourceId) {
      this.server.to(`resource_${resourceId}`).emit('userActivity', {
        userId,
        activity,
        resourceId,
      });
    }
  }
}
