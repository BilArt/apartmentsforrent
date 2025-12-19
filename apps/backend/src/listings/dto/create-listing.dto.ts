import {
  ArrayMaxSize,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CityDto {
  @IsNumber()
  geonameId!: number;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nameUk?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  admin1?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  admin2?: string;

  @IsNumber()
  lat!: number;

  @IsNumber()
  lon!: number;
}

export class CreateListingDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ValidateNested()
  @Type(() => CityDto)
  city!: CityDto;

  @IsString()
  @IsNotEmpty()
  address!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  images?: string[];
}
