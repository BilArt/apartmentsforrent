import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class LoginDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  bankId?: string;

  @ValidateIf((o: LoginDto) => !o.bankId)
  @IsString()
  @MinLength(1)
  @IsNotEmpty()
  phone?: string;

  @ValidateIf((o: LoginDto) => !o.bankId)
  @IsString()
  @MinLength(1)
  @IsNotEmpty()
  password?: string;
}
