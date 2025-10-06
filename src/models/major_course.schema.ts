import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MajorCourseDocument = MajorCourse & Document;

@Schema()
export class MajorCourse {
  @Prop({ type: Types.ObjectId, ref: 'Major', required: true })
  major_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Course', required: true })
  course_id: Types.ObjectId;
}

export const MajorCourseSchema = SchemaFactory.createForClass(MajorCourse);
