import { IsEmail, IsNotEmpty, IsString, MinLength, IsIn, IsOptional, IsDateString } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  readonly firstName: string;

  @IsString()
  @IsNotEmpty()
  readonly lastName: string;

  @IsEmail({}, { message: 'Please enter a valid email' })
  @IsNotEmpty()
  readonly email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  readonly password: string;
  
  @IsString()
  @IsNotEmpty()
  @IsIn(['male', 'female'], { message: 'Gender must be either male or female' })
  readonly gender: string;

  @IsOptional()
  @IsDateString()
  readonly birthDate?: string;
}
