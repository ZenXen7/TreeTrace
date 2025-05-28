import { PartialType, OmitType } from '@nestjs/mapped-types';
import { IsString, MinLength, IsOptional, IsDateString } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password'] as const)
) {
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;
}
