import { IsOptional, IsString, MinLength, Matches } from 'class-validator';

export class LoginDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  bankId?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+380\d{9}$/, { message: 'phone must be in format +380XXXXXXXXX' })
  phone?: string;

  @IsOptional()
  @IsString()
  @MinLength(4)
  password?: string;
}
