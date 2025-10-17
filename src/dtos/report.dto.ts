import { IsNotEmpty, IsString, IsMongoId, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReportDto {
  @ApiProperty({ description: 'ID của người bị báo cáo' })
  @IsNotEmpty({ message: 'Reported ID không được để trống' })
  @IsMongoId({ message: 'Reported ID không hợp lệ' })
  reported_id: string;

  @ApiProperty({ description: 'Lý do báo cáo' })
  @IsNotEmpty({ message: 'Lý do không được để trống' })
  @IsString({ message: 'Lý do phải là chuỗi' })
  @MinLength(10, { message: 'Lý do phải có ít nhất 10 ký tự' })
  reason: string;
}
