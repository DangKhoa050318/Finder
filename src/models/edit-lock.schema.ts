import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type EditLockDocument = EditLock & Document;

export enum LockType {
  Slot = 'slot',
  Task = 'task',
}

@Schema({ timestamps: true })
export class EditLock {
  @Prop({ type: String, enum: Object.values(LockType), required: true })
  lock_type: LockType;

  @Prop({ type: Types.ObjectId, required: true })
  resource_id: Types.ObjectId; // slot_id or task_id

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  locked_by: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  locked_at: Date;

  @Prop({ type: Date, default: () => new Date(Date.now() + 300000) })
  expires_at: Date; // Auto-expire after 5 minutes

  @Prop({ type: String, default: null })
  socket_id: string;

  @Prop({ type: Boolean, default: true })
  is_active: boolean;
}

export const EditLockSchema = SchemaFactory.createForClass(EditLock);

// Indexes
EditLockSchema.index({ resource_id: 1, lock_type: 1 });
EditLockSchema.index({ locked_by: 1 });
EditLockSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 }); // TTL index
EditLockSchema.index({ is_active: 1 });
