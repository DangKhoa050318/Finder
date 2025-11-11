import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsDateString,
  IsMongoId,
  IsEnum,
  MinLength,
  IsArray,
  ValidateNested,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SlotType } from '../models/slot.schema';

export class AttachmentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  filename: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  originalName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  mimetype: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  size: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  url: string;
}

export class CreateGroupSlotDto {
  @ApiProperty({ description: 'ID của nhóm' })
  @IsNotEmpty({ message: 'Group ID không được để trống' })
  @IsMongoId({ message: 'Group ID không hợp lệ' })
  group_id: string;

  @ApiProperty({ description: 'Tiêu đề slot' })
  @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
  @IsString({ message: 'Tiêu đề phải là chuỗi' })
  @MinLength(3, { message: 'Tiêu đề phải có ít nhất 3 ký tự' })
  title: string;

  @ApiPropertyOptional({ description: 'Mô tả slot' })
  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi' })
  description?: string;

  @ApiProperty({ description: 'Thời gian bắt đầu' })
  @IsNotEmpty({ message: 'Start time không được để trống' })
  @IsDateString({}, { message: 'Start time phải là định dạng datetime hợp lệ' })
  start_time: string;

  @ApiProperty({ description: 'Thời gian kết thúc' })
  @IsNotEmpty({ message: 'End time không được để trống' })
  @IsDateString({}, { message: 'End time phải là định dạng datetime hợp lệ' })
  end_time: string;

  @ApiPropertyOptional({ type: [AttachmentDto], description: 'Tệp đính kèm' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];
}

export class CreatePrivateSlotDto {
  @ApiProperty({ description: 'ID của bạn bè' })
  @IsNotEmpty({ message: 'Friend ID không được để trống' })
  @IsMongoId({ message: 'Friend ID không hợp lệ' })
  friend_id: string;

  @ApiProperty({ description: 'Tiêu đề slot' })
  @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
  @IsString({ message: 'Tiêu đề phải là chuỗi' })
  @MinLength(3, { message: 'Tiêu đề phải có ít nhất 3 ký tự' })
  title: string;

  @ApiPropertyOptional({ description: 'Mô tả slot' })
  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi' })
  description?: string;

  @ApiProperty({ description: 'Thời gian bắt đầu' })
  @IsNotEmpty({ message: 'Start time không được để trống' })
  @IsDateString({}, { message: 'Start time phải là định dạng datetime hợp lệ' })
  start_time: string;

  @ApiProperty({ description: 'Thời gian kết thúc' })
  @IsNotEmpty({ message: 'End time không được để trống' })
  @IsDateString({}, { message: 'End time phải là định dạng datetime hợp lệ' })
  end_time: string;

  @ApiPropertyOptional({ type: [AttachmentDto], description: 'Tệp đính kèm' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];
}

export class UpdateSlotDto {
  @ApiPropertyOptional({ description: 'Tiêu đề slot' })
  @IsOptional()
  @IsString({ message: 'Tiêu đề phải là chuỗi' })
  @MinLength(3, { message: 'Tiêu đề phải có ít nhất 3 ký tự' })
  title?: string;

  @ApiPropertyOptional({ description: 'Mô tả slot' })
  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi' })
  description?: string;

  @ApiPropertyOptional({ description: 'Thời gian bắt đầu' })
  @IsOptional()
  @IsDateString({}, { message: 'Start time phải là định dạng datetime hợp lệ' })
  start_time?: string;

  @ApiPropertyOptional({ description: 'Thời gian kết thúc' })
  @IsOptional()
  @IsDateString({}, { message: 'End time phải là định dạng datetime hợp lệ' })
  end_time?: string;

  @ApiPropertyOptional({ type: [AttachmentDto], description: 'Tệp đính kèm' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];
}

export class GetSlotsDto {
  @ApiPropertyOptional({ enum: SlotType, description: 'Lọc theo loại slot' })
  @IsOptional()
  @IsEnum(SlotType, { message: 'Slot type không hợp lệ' })
  slot_type?: SlotType;
}

export class SlotResponseDto {
  @ApiProperty({ description: 'ID slot', example: '507f1f77bcf86cd799439011' })
  _id: string;

  @ApiProperty({ description: 'Tiêu đề slot' })
  title: string;

  @ApiProperty({ description: 'Mô tả slot' })
  description?: string;

  @ApiProperty({ description: 'Thời gian bắt đầu' })
  start_time: Date;

  @ApiProperty({ description: 'Thời gian kết thúc' })
  end_time: Date;

  @ApiProperty({ description: 'ID người tạo' })
  created_by: string;

  @ApiProperty({ description: 'Loại slot', enum: SlotType })
  slot_type: SlotType;
}

export class SlotListResponseDto {
  @ApiProperty({ description: 'Danh sách slot', type: [SlotResponseDto] })
  data: SlotResponseDto[];
}
