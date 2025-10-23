import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';

export type GroupDocument = Group & Document;

export enum GroupVisibility {
  Public = 'public',
  Private = 'private',
}

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Group {
  @ApiProperty({
    description: 'Tên nhóm',
    example: 'Software Engineering Study Group',
  })
  @Prop({ required: true })
  group_name: string;

  @ApiProperty({
    description: 'Mô tả nhóm',
    example: 'A group for SE students to study together',
  })
  @Prop({ default: '' })
  description: string;

  @ApiProperty({
    description: 'ID trưởng nhóm',
    type: String,
  })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  leader_id: Types.ObjectId;

  @ApiProperty({
    description: 'Chế độ hiển thị nhóm',
    enum: GroupVisibility,
    example: GroupVisibility.Public,
  })
  @Prop({
    type: String,
    enum: Object.values(GroupVisibility),
    default: GroupVisibility.Public,
  })
  visibility: GroupVisibility;

  @ApiProperty({
    description: 'Số lượng thành viên tối đa',
    example: 20,
  })
  @Prop({ default: 50 })
  max_member: number;

  @ApiProperty({
    description: 'Avatar nhóm (URL)',
    example: 'https://api.example.com/avatars/group-1.jpg',
  })
  @Prop({
    type: String,
    default: 'https://api.dicebear.com/7.x/avataaars/svg?seed=group',
  })
  avatar: string;
}

export const GroupSchema = SchemaFactory.createForClass(Group);

// Index để search groups
GroupSchema.index({ group_name: 'text', description: 'text' });
GroupSchema.index({ leader_id: 1 });
