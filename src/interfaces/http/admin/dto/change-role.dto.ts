import { IsEnum } from 'class-validator';
import { Role } from '../../../../domain/auth/entities/user.entity';

export class ChangeRoleDto {
  @IsEnum(Role)
  role: Role;
}
