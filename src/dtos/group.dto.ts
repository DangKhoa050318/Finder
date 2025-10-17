import { IsNotEmpty, IsString, IsOptional, IsEnum, IsNumber, Min, Max, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GroupVisibility } from '../models/group.schema';

export class CreateGroupDto {
  @ApiProperty({ description: 'Tên nhóm' })
  @IsNotEmpty({ message: 'Tên nhóm không được để trống' })
  @IsString({ message: 'Tên nhóm phải là chuỗi' })
  @MinLength(3, { message: 'Tên nhóm phải có ít nhất 3 ký tự' })
  group_name: string;

  @ApiPropertyOptional({ description: 'Mô tả nhóm' })
  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi' })
  description?: string;

  @ApiPropertyOptional({ enum: GroupVisibility, description: 'Chế độ hiển thị', default: GroupVisibility.Public })
  @IsOptional()
  @IsEnum(GroupVisibility, { message: 'Visibility không hợp lệ' })
  visibility?: GroupVisibility;

  @ApiPropertyOptional({ description: 'Số thành viên tối đa', default: 50 })
  @IsOptional()
  @IsNumber({}, { message: 'Max member phải là số' })
  @Min(2, { message: 'Số thành viên tối đa phải >= 2' })
  @Max(200, { message: 'Số thành viên tối đa phải <= 200' })
  max_member?: number;
}

export class UpdateGroupDto {
  @ApiPropertyOptional({ description: 'Tên nhóm' })
  @IsOptional()
  @IsString({ message: 'Tên nhóm phải là chuỗi' })
  @MinLength(3, { message: 'Tên nhóm phải có ít nhất 3 ký tự' })
  group_name?: string;

  @ApiPropertyOptional({ description: 'Mô tả nhóm' })
  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi' })
  description?: string;

  @ApiPropertyOptional({ enum: GroupVisibility, description: 'Chế độ hiển thị' })
  @IsOptional()
  @IsEnum(GroupVisibility, { message: 'Visibility không hợp lệ' })
  visibility?: GroupVisibility;

  @ApiPropertyOptional({ description: 'Số thành viên tối đa' })
  @IsOptional()
  @IsNumber({}, { message: 'Max member phải là số' })
  @Min(2, { message: 'Số thành viên tối đa phải >= 2' })
  @Max(200, { message: 'Số thành viên tối đa phải <= 200' })
  max_member?: number;
}
