import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';

export type MajorDocument = Major & Document;

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Major {
  @ApiProperty({
    example: 'se',
    description: 'Mã ngành',
  })
  @Prop({ required: true, unique: true })
  key: string;

  @ApiProperty({
    example: 'Software Engineering',
    description: 'Tên ngành',
  })
  @Prop({ required: true })
  name: string;
}

export const MajorSchema = SchemaFactory.createForClass(Major);
