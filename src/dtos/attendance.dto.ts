import { IsNotEmpty, IsMongoId, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttendanceStatus } from '../models/attendance.schema';

export class RegisterSlotDto {
  @ApiProperty({ description: 'ID của slot' })
  @IsNotEmpty({ message: 'Slot ID không được để trống' })
  @IsMongoId({ message: 'Slot ID không hợp lệ' })
  slot_id: string;
}

export class UpdateAttendanceStatusDto {
  @ApiProperty({ enum: AttendanceStatus, description: 'Trạng thái attendance' })
  @IsNotEmpty({ message: 'Status không được để trống' })
  @IsEnum(AttendanceStatus, { message: 'Status không hợp lệ' })
  status: AttendanceStatus;
}

export class GetAttendancesDto {
  @ApiPropertyOptional({ enum: AttendanceStatus, description: 'Lọc theo trạng thái' })
  @IsOptional()
  @IsEnum(AttendanceStatus, { message: 'Status không hợp lệ' })
  status?: AttendanceStatus;

  @ApiPropertyOptional({ description: 'Số trang', default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Số lượng mỗi trang', default: 20 })
  @IsOptional()
  limit?: number;
}
