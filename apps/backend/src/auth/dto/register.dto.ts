import { IsOptional, IsString, MinLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(1)
  bankId!: string;

  @IsString()
  @MinLength(1)
  firstName!: string;

  @IsString()
  @MinLength(1)
  lastName!: string;

  @IsString()
  @Matches(/^\+380\d{9}$/, { message: 'phone must be in format +380XXXXXXXXX' })
  phone!: string;

  @IsOptional()
  @IsString()
  @MinLength(4)
  password?: string;
}
