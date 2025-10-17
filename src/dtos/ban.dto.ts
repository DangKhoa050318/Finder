import { IsNotEmpty, IsString, IsOptional, IsMongoId, IsDateString, IsEnum, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BanStatus } from '../models/ban.schema';

export class BanUserDto {
  @ApiProperty({ description: 'ID của người bị ban' })
  @IsNotEmpty({ message: 'User ID không được để trống' })
  @IsMongoId({ message: 'User ID không hợp lệ' })
  user_id: string;

  @ApiProperty({ description: 'Lý do ban' })
  @IsNotEmpty({ message: 'Lý do không được để trống' })
  @IsString({ message: 'Lý do phải là chuỗi' })
  @MinLength(10, { message: 'Lý do phải có ít nhất 10 ký tự' })
  reason: string;

  @ApiPropertyOptional({ description: 'Thời gian kết thúc ban (null = permanent)' })
  @IsOptional()
  @IsDateString({}, { message: 'Until phải là định dạng datetime hợp lệ' })
  until?: string;
}

export class UpdateBanDto {
  @ApiPropertyOptional({ description: 'Lý do ban mới' })
  @IsOptional()
  @IsString({ message: 'Lý do phải là chuỗi' })
  @MinLength(10, { message: 'Lý do phải có ít nhất 10 ký tự' })
  reason?: string;

  @ApiPropertyOptional({ description: 'Thời gian kết thúc ban mới' })
  @IsOptional()
  @IsDateString({}, { message: 'Until phải là định dạng datetime hợp lệ' })
  until?: string;

  @ApiPropertyOptional({ enum: BanStatus, description: 'Trạng thái ban' })
  @IsOptional()
  @IsEnum(BanStatus, { message: 'Status không hợp lệ' })
  status?: BanStatus;
}
