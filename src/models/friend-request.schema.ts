import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';

export type FriendRequestDocument = FriendRequest & Document;

export enum FriendRequestStatus {
  Pending = 'pending',
  Accepted = 'accepted',
  Rejected = 'rejected',
}

@Schema({
  timestamps: true,
  versionKey: false,
})
export class FriendRequest {
  @ApiProperty({
    description: 'ID người gửi lời mời',
    type: String,
  })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  requester_id: Types.ObjectId;

  @ApiProperty({
    description: 'ID người nhận lời mời kết bạn',
    type: String,
  })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  requestee_id: Types.ObjectId;

  @ApiProperty({
    description: 'Ngày gửi lời mời',
    example: '2025-10-17T00:00:00.000Z',
  })
  @Prop({ type: Date, default: Date.now })
  date: Date;

  @ApiProperty({
    description: 'Trạng thái lời mời',
    enum: FriendRequestStatus,
    example: FriendRequestStatus.Pending,
  })
  @Prop({
    type: String,
    enum: Object.values(FriendRequestStatus),
    default: FriendRequestStatus.Pending,
  })
  status: FriendRequestStatus;
}

export const FriendRequestSchema = SchemaFactory.createForClass(FriendRequest);


FriendRequestSchema.index({ requester_id: 1, requestee_id: 1 }, { unique: true });
