import { IsNotEmpty, IsString, IsOptional, MinLength, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class AttachmentDto {
  @ApiProperty({ description: 'Tên file trên server' })
  @IsString()
  filename: string;

  @ApiProperty({ description: 'Tên file gốc' })
  @IsString()
  originalName: string;

  @ApiProperty({ description: 'MIME type' })
  @IsString()
  mimetype: string;

  @ApiProperty({ description: 'Kích thước file (bytes)' })
  size: number;

  @ApiProperty({ description: 'URL truy cập file' })
  @IsString()
  url: string;
}

export class CreateNewsDto {
  @ApiProperty({ description: 'Tiêu đề tin tức' })
  @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
  @IsString({ message: 'Tiêu đề phải là chuỗi' })
  @MinLength(5, { message: 'Tiêu đề phải có ít nhất 5 ký tự' })
  title: string;

  @ApiProperty({ description: 'Nội dung tin tức' })
  @IsNotEmpty({ message: 'Nội dung không được để trống' })
  @IsString({ message: 'Nội dung phải là chuỗi' })
  @MinLength(20, { message: 'Nội dung phải có ít nhất 20 ký tự' })
  content: string;

  @ApiPropertyOptional({
    description: 'Danh sách file đính kèm',
    type: [AttachmentDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];
}

export class UpdateNewsDto {
  @ApiPropertyOptional({ description: 'Tiêu đề tin tức' })
  @IsOptional()
  @IsString({ message: 'Tiêu đề phải là chuỗi' })
  @MinLength(5, { message: 'Tiêu đề phải có ít nhất 5 ký tự' })
  title?: string;

  @ApiPropertyOptional({ description: 'Nội dung tin tức' })
  @IsOptional()
  @IsString({ message: 'Nội dung phải là chuỗi' })
  @MinLength(20, { message: 'Nội dung phải có ít nhất 20 ký tự' })
  content?: string;

  @ApiPropertyOptional({
    description: 'Danh sách file đính kèm',
    type: [AttachmentDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];
}
