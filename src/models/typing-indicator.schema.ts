import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TypingIndicatorDocument = TypingIndicator & Document;

export enum TypingContext {
  Chat = 'chat',
  TaskComment = 'task_comment',
  SlotComment = 'slot_comment',
}

@Schema({ timestamps: true })
export class TypingIndicator {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user_id: Types.ObjectId;

  @Prop({ type: String, enum: Object.values(TypingContext), required: true })
  context: TypingContext;

  @Prop({ type: Types.ObjectId, required: true })
  resource_id: Types.ObjectId; // chat_id, task_id, or slot_id

  @Prop({ type: Date, default: Date.now })
  started_at: Date;

  @Prop({ type: Date, default: () => new Date(Date.now() + 5000) })
  expires_at: Date; // Auto-expire after 5 seconds
}

export const TypingIndicatorSchema = SchemaFactory.createForClass(TypingIndicator);

// Indexes
TypingIndicatorSchema.index({ resource_id: 1, context: 1 });
TypingIndicatorSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 }); // TTL index
TypingIndicatorSchema.index({ user_id: 1, resource_id: 1, context: 1 }, { unique: true });
