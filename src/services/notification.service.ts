import {
  Injectable,
  NotFoundException,
  BadRequestException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationType } from '../models/notification.schema';
import {
  CreateNotificationDto,
  UpdateNotificationDto,
  GetNotificationsDto,
  MarkAsReadDto,
  DeleteNotificationDto,
} from '../dtos/notification.dto';
import { NotificationGateway } from '../gateways/notification.gateway';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<Notification>,
    @Inject(forwardRef(() => NotificationGateway))
    private notificationGateway: NotificationGateway,
  ) {}

  /**
   * Create a new notification
   */
  async createNotification(dto: CreateNotificationDto): Promise<Notification> {
    const notification = new this.notificationModel({
      user_id: new Types.ObjectId(dto.user_id),
      type: dto.type,
      title: dto.title,
      description: dto.description,
      message: dto.message,
      avatar: dto.avatar,
      relatedId: dto.relatedId ? new Types.ObjectId(dto.relatedId) : undefined,
      actionUrl: dto.actionUrl,
      actionLabel: dto.actionLabel,
      metadata: dto.metadata,
      isRead: false,
    });

    const savedNotification = await notification.save();

    // Send real-time notification via WebSocket
    try {
      this.notificationGateway.sendNotificationToUser(
        dto.user_id,
        savedNotification.toJSON(),
      );
    } catch (error) {
      console.error('Failed to send real-time notification:', error);
    }

    return savedNotification;
  }

  /**
   * Get notifications for a user with filtering and pagination
   */
  async getUserNotifications(
    userId: string,
    query: GetNotificationsDto,
  ): Promise<any> {
    const { type, unread_only = false, page = 1, limit = 20 } = query;

    const skip = (page - 1) * limit;
    const filter: any = {
      user_id: new Types.ObjectId(userId),
    };

    if (type) {
      filter.type = type;
    }

    if (unread_only) {
      filter.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      this.notificationModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.notificationModel.countDocuments(filter),
      this.notificationModel.countDocuments({
        user_id: new Types.ObjectId(userId),
        isRead: false,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: notifications,
      total,
      page,
      limit,
      totalPages,
      unreadCount,
    };
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationModel.countDocuments({
      user_id: new Types.ObjectId(userId),
      isRead: false,
    });
  }

  /**
   * Get a single notification by ID
   */
  async getNotificationById(id: string): Promise<Notification> {
    const notificationObjectId = new Types.ObjectId(id);

    const notification =
      await this.notificationModel.findById(notificationObjectId);

    if (!notification) {
      throw new NotFoundException('Không tìm thấy thông báo');
    }

    return notification;
  }

  /**
   * Update a notification
   */
  async updateNotification(
    id: string,
    dto: UpdateNotificationDto,
  ): Promise<Notification> {
    const notificationObjectId = new Types.ObjectId(id);

    const notification = await this.notificationModel.findByIdAndUpdate(
      notificationObjectId,
      {
        ...dto,
        updatedAt: new Date(),
      },
      { new: true },
    );

    if (!notification) {
      throw new NotFoundException('Không tìm thấy thông báo');
    }

    return notification;
  }

  /**
   * Mark notifications as read
   */
  async markAsRead(userId: string, dto: MarkAsReadDto): Promise<any> {
    const result = await this.notificationModel.updateMany(
      {
        _id: { $in: dto.notification_ids.map((id) => new Types.ObjectId(id)) },
        user_id: new Types.ObjectId(userId),
      },
      {
        isRead: true,
        updatedAt: new Date(),
      },
    );

    if (result.matchedCount === 0) {
      throw new BadRequestException('Không tìm thấy thông báo để cập nhật');
    }

    // Update unread count via WebSocket
    try {
      const unreadCount = await this.getUnreadCount(userId);
      this.notificationGateway.sendUnreadCountUpdate(userId, unreadCount);
    } catch (error) {
      console.error('Failed to send unread count update:', error);
    }

    return {
      message: 'Đánh dấu đã đọc thành công',
      updated: result.modifiedCount,
    };
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<any> {
    const result = await this.notificationModel.updateMany(
      {
        user_id: new Types.ObjectId(userId),
        isRead: false,
      },
      {
        isRead: true,
        updatedAt: new Date(),
      },
    );

    // Update unread count via WebSocket
    try {
      this.notificationGateway.sendUnreadCountUpdate(userId, 0);
    } catch (error) {
      console.error('Failed to send unread count update:', error);
    }

    return {
      message: 'Đánh dấu tất cả thông báo đã đọc',
      updated: result.modifiedCount,
    };
  }

  /**
   * Delete notifications
   */
  async deleteNotifications(
    userId: string,
    dto: DeleteNotificationDto,
  ): Promise<any> {
    const result = await this.notificationModel.deleteMany({
      _id: { $in: dto.notification_ids.map((id) => new Types.ObjectId(id)) },
      user_id: new Types.ObjectId(userId),
    });

    if (result.deletedCount === 0) {
      throw new BadRequestException('Không tìm thấy thông báo để xóa');
    }

    return {
      message: 'Xóa thông báo thành công',
      deleted: result.deletedCount,
    };
  }

  /**
   * Delete all notifications for a user
   */
  async deleteAllNotifications(userId: string): Promise<any> {
    const result = await this.notificationModel.deleteMany({
      user_id: new Types.ObjectId(userId),
    });

    return {
      message: 'Xóa tất cả thông báo thành công',
      deleted: result.deletedCount,
    };
  }

  /**
   * Clear old notifications (older than 30 days)
   */
  async clearOldNotifications(days: number = 30): Promise<any> {
    const date = new Date();
    date.setDate(date.getDate() - days);

    const result = await this.notificationModel.deleteMany({
      createdAt: { $lt: date },
    });

    return {
      message: `Xóa thông báo cũ (hơn ${days} ngày) thành công`,
      deleted: result.deletedCount,
    };
  }

  /**
   * Send friend request notification
   */
  async sendFriendRequestNotification(
    userId: string,
    requesterName: string,
    requesterId: string,
    avatar?: string,
  ): Promise<Notification> {
    return this.createNotification({
      user_id: userId,
      type: NotificationType.FRIEND_REQUEST,
      title: `${requesterName} đã gửi lời mời kết bạn`,
      description: 'Chấp nhận hoặc từ chối lời mời',
      avatar,
      relatedId: requesterId,
      actionUrl: '/dashboard/friends/requests?tab=received',
      actionLabel: 'Xem lời mời',
    });
  }

  /**
   * Send friend request accepted notification
   */
  async sendFriendRequestAcceptedNotification(
    userId: string,
    accepterName: string,
    accepterId: string,
    avatar?: string,
  ): Promise<Notification> {
    return this.createNotification({
      user_id: userId,
      type: NotificationType.FRIEND_REQUEST_ACCEPTED,
      title: `${accepterName} đã chấp nhận lời mời kết bạn`,
      avatar,
      relatedId: accepterId,
      actionUrl: `/dashboard/profile/${accepterId}`,
      actionLabel: 'Xem hồ sơ',
    });
  }

  /**
   * Send group member joined notification
   */
  async sendGroupMemberJoinedNotification(
    userIds: string[],
    groupName: string,
    memberName: string,
    groupId: string,
    avatar?: string,
  ): Promise<void> {
    const notifications = userIds.map((userId) =>
      this.createNotification({
        user_id: userId,
        type: NotificationType.GROUP_MEMBER_JOINED,
        title: `${memberName} đã tham gia nhóm ${groupName}`,
        avatar,
        relatedId: groupId,
        actionUrl: `/dashboard/groups/${groupId}`,
        actionLabel: 'Xem nhóm',
      }),
    );

    await Promise.all(notifications);
  }

  /**
   * Send news notification
   */
  async sendNewsNotification(
    userId: string,
    newsTitle: string,
    newsId: string,
  ): Promise<Notification> {
    return this.createNotification({
      user_id: userId,
      type: NotificationType.NEWS,
      title: `Tin tức mới: ${newsTitle}`,
      description: 'Bạn có tin tức mới từ hệ thống',
      relatedId: newsId,
      actionUrl: `/dashboard/news/${newsId}`,
      actionLabel: 'Xem tin tức',
    });
  }

  /**
   * Send slot reminder notification
   */
  async sendSlotReminderNotification(
    userId: string,
    slotTitle: string,
    slotId: string,
    startTime: Date,
  ): Promise<Notification> {
    const timeUntil = Math.floor(
      (startTime.getTime() - Date.now()) / (1000 * 60),
    );
    return this.createNotification({
      user_id: userId,
      type: NotificationType.SLOT_REMINDER,
      title: `Nhắc nhở: ${slotTitle}`,
      description: `Lịch học sẽ bắt đầu sau ${timeUntil} phút`,
      relatedId: slotId,
      actionUrl: `/dashboard/slots/${slotId}`,
      actionLabel: 'Xem chi tiết',
    });
  }

  /**
   * Send slot created notification to participants
   */
  async sendSlotCreatedNotification(
    userIds: string[],
    slotTitle: string,
    slotId: string,
    creatorName: string,
  ): Promise<void> {
    const notifications = userIds.map((userId) =>
      this.createNotification({
        user_id: userId,
        type: NotificationType.SLOT_CREATED,
        title: `${creatorName} đã tạo lịch học: ${slotTitle}`,
        relatedId: slotId,
        actionUrl: `/dashboard/slots/${slotId}`,
        actionLabel: 'Xem lịch học',
      }),
    );
    await Promise.all(notifications);
  }

  /**
   * Send message notification
   */
  async sendMessageNotification(
    userId: string,
    senderName: string,
    message: string,
    chatId: string,
  ): Promise<Notification> {
    return this.createNotification({
      user_id: userId,
      type: NotificationType.MESSAGE,
      title: `${senderName} đã gửi tin nhắn`,
      description:
        message.length > 50 ? message.substring(0, 50) + '...' : message,
      relatedId: chatId,
      actionUrl: `/dashboard/messages/${chatId}`,
      actionLabel: 'Xem tin nhắn',
    });
  }
}
