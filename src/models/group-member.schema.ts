import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';

export type GroupMemberDocument = GroupMember & Document;

export enum GroupMemberRole {
  Leader = 'leader',
  Member = 'member',
}

@Schema({
  timestamps: true,
  versionKey: false,
})
export class GroupMember {
  @ApiProperty({
    description: 'ID nhóm',
    type: String,
  })
  @Prop({ type: Types.ObjectId, ref: 'Group', required: true })
  group_id: Types.ObjectId;

  @ApiProperty({
    description: 'ID thành viên',
    type: String,
  })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user_id: Types.ObjectId;

  @ApiProperty({
    description: 'Vai trò',
    enum: GroupMemberRole,
    example: GroupMemberRole.Member,
  })
  @Prop({
    type: String,
    enum: Object.values(GroupMemberRole),
    default: GroupMemberRole.Member,
  })
  role: GroupMemberRole;

  @ApiProperty({
    description: 'Ngày tham gia nhóm',
    example: '2025-10-17T00:00:00.000Z',
  })
  @Prop({ type: Date, default: Date.now })
  joined_at: Date;
}

export const GroupMemberSchema = SchemaFactory.createForClass(GroupMember);

// Đảm bảo user không join nhóm 2 lần
GroupMemberSchema.index({ group_id: 1, user_id: 1 }, { unique: true });
// Index để query members của group
GroupMemberSchema.index({ group_id: 1 });
