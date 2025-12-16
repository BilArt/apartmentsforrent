import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export enum City {
  Kyiv = 'Kyiv',
  Lviv = 'Lviv',
}

export class CreateListingDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsEnum(City)
  city!: City;

  @IsString()
  @IsNotEmpty()
  address!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  images?: string[];
}
