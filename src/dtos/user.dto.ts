import { Exclude } from 'class-transformer';
import { User } from 'src/models/user.schema';

export class UserResponseDto extends User {
  @Exclude()
  declare password: string;
}
