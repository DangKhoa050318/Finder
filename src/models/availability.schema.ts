import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AvailabilityDocument = Availability & Document;

// day_of_week: 1..7 (1=Monday, 7=Sunday) or adapt to your locale
@Schema({ timestamps: true })
export class Availability {
  // Use a hex string from ObjectId to avoid external deps
  @Prop({ default: () => new Types.ObjectId().toHexString(), unique: true })
  avai_id: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  user_id: Types.ObjectId;

  @Prop({ required: true, min: 1, max: 7, index: true })
  day_of_week: number;

  // Store time as string HH:mm to avoid TZ pitfalls; validate via regex
  @Prop({ required: true, match: /^([0-1]\d|2[0-3]):([0-5]\d)$/ })
  start_time: string;

  @Prop({ required: true, match: /^([0-1]\d|2[0-3]):([0-5]\d)$/ })
  end_time: string;
}

export const AvailabilitySchema = SchemaFactory.createForClass(Availability);

// Prevent overlapping ranges for the same user and day at DB level (partial)
// Note: Complex overlap prevention usually needs application logic.
AvailabilitySchema.index(
  { user_id: 1, day_of_week: 1, start_time: 1, end_time: 1 },
  { name: 'user_day_time_range' },
);
