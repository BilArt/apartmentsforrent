import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
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

  @IsOptional()
  @IsIn(['old', 'new'])
  buildingType?: 'old' | 'new';

  @IsOptional()
  @IsIn(['long', 'daily'])
  rentType?: 'long' | 'daily';

  @IsOptional()
  @IsNumber()
  @Min(0)
  area?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  rooms?: number;

  @IsOptional()
  @IsString()
  availableFrom?: string;

  @IsOptional()
  @IsBoolean()
  kitchen?: boolean;

  @IsOptional()
  @IsBoolean()
  pets?: boolean;

  @IsOptional()
  @IsBoolean()
  lift?: boolean;

  @IsOptional()
  @IsBoolean()
  parking?: boolean;

  @IsOptional()
  @IsBoolean()
  furnished?: boolean;

  @IsOptional()
  @IsBoolean()
  balcony?: boolean;

  @IsOptional()
  @IsBoolean()
  storage?: boolean;
}
