import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum NotificationType {
  FRIEND_REQUEST = 'friend_request',
  FRIEND_REQUEST_ACCEPTED = 'friend_request_accepted',
  FRIEND_REQUEST_REJECTED = 'friend_request_rejected',
  GROUP_JOIN_REQUEST = 'group_join_request',
  GROUP_INVITE = 'group_invite',
  GROUP_MEMBER_JOINED = 'group_member_joined',
  GROUP_MEMBER_LEFT = 'group_member_left',
  SLOT_REMINDER = 'slot_reminder',
  SLOT_CREATED = 'slot_created',
  SLOT_UPDATED = 'slot_updated',
  SLOT_CANCELLED = 'slot_cancelled',
  SLOT_APPROVAL_REQUEST = 'slot_approval_request',  // Member tạo slot, chờ leader duyệt
  SLOT_APPROVED = 'slot_approved',                  // Leader đã duyệt slot
  SLOT_REJECTED = 'slot_rejected',                  // Leader từ chối slot
  REMINDER = 'reminder',
  NEWS = 'news',
  MESSAGE = 'message',
  SYSTEM = 'system',
}

@Schema({ timestamps: true })
export class Notification extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  user_id: Types.ObjectId;

  @Prop({ type: String, enum: NotificationType, required: true, index: true })
  type: NotificationType;

  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop()
  message?: string;

  @Prop()
  avatar?: string;

  // ID của entity liên quan (friend request ID, group ID, etc)
  @Prop({ type: Types.ObjectId, index: true })
  relatedId?: Types.ObjectId;

  // URL để xem chi tiết hoặc thực hiện action
  @Prop()
  actionUrl?: string;

  // Label của button action
  @Prop()
  actionLabel?: string;

  @Prop({ default: false, index: true })
  isRead: boolean;

  // Metadata linh hoạt để lưu dữ liệu bổ sung
  @Prop({ type: Object })
  metadata?: Record<string, any>;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Indexes for performance
NotificationSchema.index({ user_id: 1, isRead: 1 });
NotificationSchema.index({ user_id: 1, createdAt: -1 });
NotificationSchema.index({ user_id: 1, type: 1 });
NotificationSchema.index({ createdAt: -1 });
