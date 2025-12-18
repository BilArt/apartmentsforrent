import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateRequestDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  message?: string;

  @IsDateString()
  from!: string;

  @IsDateString()
  to!: string;
}
