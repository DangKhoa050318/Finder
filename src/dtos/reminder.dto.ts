import { IsNotEmpty, IsString, IsOptional, IsDateString, IsMongoId, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReminderMethod, ReminderStatus } from '../models/reminder.schema';

export class CreateReminderDto {
  @ApiProperty({ description: 'ID của slot' })
  @IsNotEmpty({ message: 'Slot ID không được để trống' })
  @IsMongoId({ message: 'Slot ID không hợp lệ' })
  slot_id: string;

  @ApiProperty({ description: 'Thời gian nhắc nhở' })
  @IsNotEmpty({ message: 'Remind at không được để trống' })
  @IsDateString({}, { message: 'Remind at phải là định dạng datetime hợp lệ' })
  remind_at: string;

  @ApiPropertyOptional({ enum: ReminderMethod, description: 'Phương thức nhắc nhở', default: ReminderMethod.InApp })
  @IsOptional()
  @IsEnum(ReminderMethod, { message: 'Method không hợp lệ' })
  method?: ReminderMethod;

  @ApiPropertyOptional({ description: 'Nội dung tùy chỉnh' })
  @IsOptional()
  @IsString({ message: 'Message phải là chuỗi' })
  message?: string;
}

export class UpdateReminderDto {
  @ApiPropertyOptional({ description: 'Thời gian nhắc nhở' })
  @IsOptional()
  @IsDateString({}, { message: 'Remind at phải là định dạng datetime hợp lệ' })
  remind_at?: string;

  @ApiPropertyOptional({ enum: ReminderMethod, description: 'Phương thức nhắc nhở' })
  @IsOptional()
  @IsEnum(ReminderMethod, { message: 'Method không hợp lệ' })
  method?: ReminderMethod;

  @ApiPropertyOptional({ description: 'Nội dung tùy chỉnh' })
  @IsOptional()
  @IsString({ message: 'Message phải là chuỗi' })
  message?: string;
}

export class GetRemindersDto {
  @ApiPropertyOptional({ enum: ReminderStatus, description: 'Lọc theo trạng thái' })
  @IsOptional()
  @IsEnum(ReminderStatus, { message: 'Status không hợp lệ' })
  status?: ReminderStatus;

  @ApiPropertyOptional({ description: 'Số trang', default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Số lượng mỗi trang', default: 20 })
  @IsOptional()
  limit?: number;
}
