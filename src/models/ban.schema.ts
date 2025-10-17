import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';

export type BanDocument = Ban & Document;

export enum BanStatus {
  Active = 'active',
  Expired = 'expired',
  Revoked = 'revoked',
}

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Ban {
  @ApiProperty({
    description: 'ID người bị ban',
    type: String,
  })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user_id: Types.ObjectId;

  @ApiProperty({
    description: 'ID admin thực hiện ban',
    type: String,
  })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  banned_by: Types.ObjectId;

  @ApiProperty({
    description: 'Lý do ban',
    example: 'Violation of community guidelines',
  })
  @Prop({ required: true })
  reason: string;

  @ApiProperty({
    description: 'Ngày bắt đầu ban',
    example: '2025-10-17T00:00:00.000Z',
  })
  @Prop({ type: Date, default: Date.now })
  date: Date;

  @ApiProperty({
    description: 'Ngày hết hạn ban (null = vĩnh viễn)',
    example: '2025-11-17T00:00:00.000Z',
    nullable: true,
  })
  @Prop({ type: Date, default: null })
  until: Date | null;

  @ApiProperty({
    description: 'Trạng thái ban',
    enum: BanStatus,
    example: BanStatus.Active,
  })
  @Prop({
    type: String,
    enum: Object.values(BanStatus),
    default: BanStatus.Active,
  })
  status: BanStatus;
}

export const BanSchema = SchemaFactory.createForClass(Ban);

// Index để query bans theo user và status
BanSchema.index({ user_id: 1, status: 1 });
