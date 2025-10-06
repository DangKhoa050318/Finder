import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CourseDocument = Course & Document;

@Schema()
export class Course {
  @Prop({ required: true, unique: true })
  course_id: string;

  @Prop({ required: true })
  course_name: string;
}

export const CourseSchema = SchemaFactory.createForClass(Course);