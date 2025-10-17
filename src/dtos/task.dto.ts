import { IsNotEmpty, IsString, IsOptional, IsDateString, IsMongoId, IsEnum, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskStatus, TaskPriority } from '../models/task.schema';

export class CreateTaskDto {
  @ApiProperty({ description: 'Tiêu đề task' })
  @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
  @IsString({ message: 'Tiêu đề phải là chuỗi' })
  @MinLength(3, { message: 'Tiêu đề phải có ít nhất 3 ký tự' })
  title: string;

  @ApiPropertyOptional({ description: 'Mô tả task' })
  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi' })
  description?: string;

  @ApiPropertyOptional({ description: 'Ngày đến hạn' })
  @IsOptional()
  @IsDateString({}, { message: 'Due date phải là định dạng datetime hợp lệ' })
  due_date?: string;

  @ApiPropertyOptional({ description: 'ID của slot (nếu có)' })
  @IsOptional()
  @IsMongoId({ message: 'Slot ID không hợp lệ' })
  slot_id?: string;

  @ApiPropertyOptional({ enum: TaskPriority, description: 'Độ ưu tiên', default: TaskPriority.Medium })
  @IsOptional()
  @IsEnum(TaskPriority, { message: 'Priority không hợp lệ' })
  priority?: TaskPriority;
}

export class UpdateTaskDto {
  @ApiPropertyOptional({ description: 'Tiêu đề task' })
  @IsOptional()
  @IsString({ message: 'Tiêu đề phải là chuỗi' })
  @MinLength(3, { message: 'Tiêu đề phải có ít nhất 3 ký tự' })
  title?: string;

  @ApiPropertyOptional({ description: 'Mô tả task' })
  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi' })
  description?: string;

  @ApiPropertyOptional({ description: 'Ngày đến hạn' })
  @IsOptional()
  @IsDateString({}, { message: 'Due date phải là định dạng datetime hợp lệ' })
  due_date?: string;

  @ApiPropertyOptional({ enum: TaskStatus, description: 'Trạng thái task' })
  @IsOptional()
  @IsEnum(TaskStatus, { message: 'Status không hợp lệ' })
  status?: TaskStatus;

  @ApiPropertyOptional({ enum: TaskPriority, description: 'Độ ưu tiên' })
  @IsOptional()
  @IsEnum(TaskPriority, { message: 'Priority không hợp lệ' })
  priority?: TaskPriority;
}

export class GetTasksDto {
  @ApiPropertyOptional({ enum: TaskStatus, description: 'Lọc theo trạng thái' })
  @IsOptional()
  @IsEnum(TaskStatus, { message: 'Status không hợp lệ' })
  status?: TaskStatus;

  @ApiPropertyOptional({ enum: TaskPriority, description: 'Lọc theo độ ưu tiên' })
  @IsOptional()
  @IsEnum(TaskPriority, { message: 'Priority không hợp lệ' })
  priority?: TaskPriority;

  @ApiPropertyOptional({ description: 'Số trang', default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Số lượng mỗi trang', default: 20 })
  @IsOptional()
  limit?: number;
}
