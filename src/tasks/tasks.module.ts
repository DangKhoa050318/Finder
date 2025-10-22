import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TasksService } from './tasks.service';
import { BanService } from '../services/ban.service';
import { ReminderService } from '../services/reminder.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Ban, BanSchema } from '../models/ban.schema';
import { Reminder, ReminderSchema } from '../models/reminder.schema';
import { Slot, SlotSchema } from '../models/slot.schema';
import { UserSchemaModule } from '../models/user.schema';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    UserSchemaModule,
    MongooseModule.forFeature([
      { name: Ban.name, schema: BanSchema },
      { name: Reminder.name, schema: ReminderSchema },
      { name: Slot.name, schema: SlotSchema },
    ]),
  ],
  providers: [TasksService, BanService, ReminderService],
})
export class TasksModule {}
