import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';

export type NewsDocument = News & Document;

@Schema({
  timestamps: true,
  versionKey: false,
})
export class News {
  @ApiProperty({
    description: 'ID tác giả (admin)',
    type: String,
  })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  author_id: Types.ObjectId;

  @ApiProperty({
    description: 'Tiêu đề tin tức',
    example: 'New features released!',
  })
  @Prop({ required: true })
  title: string;

  @ApiProperty({
    description: 'Nội dung tin tức',
    example: 'We are excited to announce...',
  })
  @Prop({ required: true, type: String })
  content: string;

  @ApiProperty({
    description: 'Ngày tạo',
    example: '2025-10-17T00:00:00.000Z',
  })
  @Prop({ type: Date, default: Date.now })
  created_at: Date;
}

export const NewsSchema = SchemaFactory.createForClass(News);


NewsSchema.index({ created_at: -1 });
