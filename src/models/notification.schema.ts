import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum NotificationType {
  FRIEND_REQUEST = 'friend_request',
  FRIEND_REQUEST_ACCEPTED = 'friend_request_accepted',
  FRIEND_REQUEST_REJECTED = 'friend_request_rejected',
  GROUP_INVITE = 'group_invite',
  GROUP_MEMBER_JOINED = 'group_member_joined',
  GROUP_MEMBER_LEFT = 'group_member_left',
  REMINDER = 'reminder',
  NEWS = 'news',
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

  @Prop({ default: Date.now, index: true })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Indexes for performance
NotificationSchema.index({ user_id: 1, isRead: 1 });
NotificationSchema.index({ user_id: 1, createdAt: -1 });
NotificationSchema.index({ user_id: 1, type: 1 });
NotificationSchema.index({ createdAt: -1 });
