import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';

export type ReportDocument = Report & Document;

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Report {
  @ApiProperty({
    description: 'ID người báo cáo',
    type: String,
  })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  reporter_id: Types.ObjectId;

  @ApiProperty({
    description: 'ID người bị báo cáo',
    type: String,
  })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  reported_id: Types.ObjectId;

  @ApiProperty({
    description: 'Lý do báo cáo',
    example: 'Spam or harassment',
  })
  @Prop({ required: true })
  reason: string;

  @ApiProperty({
    description: 'Ngày báo cáo',
    example: '2025-10-17T00:00:00.000Z',
  })
  @Prop({ type: Date, default: Date.now })
  date: Date;
}

export const ReportSchema = SchemaFactory.createForClass(Report);


ReportSchema.index({ reporter_id: 1 });
ReportSchema.index({ reported_id: 1 });
