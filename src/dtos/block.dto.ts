import { IsNotEmpty, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BlockUserDto {
  @ApiProperty({ description: 'ID của người cần chặn' })
  @IsNotEmpty({ message: 'User ID không được để trống' })
  @IsMongoId({ message: 'User ID không hợp lệ' })
  blocked_id: string;
}

export class UnblockUserDto {
  @ApiProperty({ description: 'ID của người cần bỏ chặn' })
  @IsNotEmpty({ message: 'User ID không được để trống' })
  @IsMongoId({ message: 'User ID không hợp lệ' })
  blocked_id: string;
}
