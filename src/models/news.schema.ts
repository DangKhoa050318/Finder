import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';

export type NewsDocument = News & Document;

export interface Attachment {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
}

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
    description: 'Danh sách file đính kèm (ảnh, tài liệu)',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        filename: { type: 'string' },
        originalName: { type: 'string' },
        mimetype: { type: 'string' },
        size: { type: 'number' },
        url: { type: 'string' },
      },
    },
  })
  @Prop({
    type: [
      {
        filename: String,
        originalName: String,
        mimetype: String,
        size: Number,
        url: String,
      },
    ],
    default: [],
  })
  attachments: Attachment[];
}

export const NewsSchema = SchemaFactory.createForClass(News);

NewsSchema.index({ createdAt: -1 });
