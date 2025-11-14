import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserPresenceDocument = UserPresence & Document;

export enum PresenceStatus {
  Online = 'Online',
  Away = 'Away',
  DoNotDisturb = 'DoNotDisturb',
  Offline = 'Offline',
}

export enum ActivityType {
  ViewingSlot = 'viewing_slot',
  EditingSlot = 'editing_slot',
  ViewingTask = 'viewing_task',
  EditingTask = 'editing_task',
  InChat = 'in_chat',
  Idle = 'idle',
}

@Schema({ timestamps: true })
export class UserPresence {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  user_id: Types.ObjectId;

  @Prop({ 
    type: String, 
    enum: Object.values(PresenceStatus), 
    default: PresenceStatus.Offline 
  })
  status: PresenceStatus;

  @Prop({ type: Date, default: Date.now })
  last_seen: Date;

  @Prop({ type: Boolean, default: false })
  is_online: boolean;

  @Prop({ type: String, enum: Object.values(ActivityType), default: ActivityType.Idle })
  current_activity: ActivityType;

  @Prop({ type: Types.ObjectId, default: null })
  current_resource_id: Types.ObjectId; // slot_id, task_id, or chat_id

  @Prop({ type: [String], default: [] })
  socket_ids: string[]; // Multiple sockets for same user (multiple tabs)

  @Prop({ type: String, default: null })
  custom_status_message: string;

  @Prop({ type: Date, default: null })
  away_since: Date;

  @Prop({ type: Object, default: {} })
  device_info: {
    platform?: string;
    browser?: string;
    is_mobile?: boolean;
  };
}

export const UserPresenceSchema = SchemaFactory.createForClass(UserPresence);

// Indexes for performance
UserPresenceSchema.index({ user_id: 1 });
UserPresenceSchema.index({ is_online: 1 });
UserPresenceSchema.index({ status: 1 });
UserPresenceSchema.index({ current_resource_id: 1 });
UserPresenceSchema.index({ last_seen: -1 });
