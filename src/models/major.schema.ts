import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MajorDocument = Major & Document;

@Schema()
export class Major {
  @Prop({ required: true, unique: true })
  major_id: string;

  @Prop({ required: true })
  major_name: string;
}

export const MajorSchema = SchemaFactory.createForClass(Major);