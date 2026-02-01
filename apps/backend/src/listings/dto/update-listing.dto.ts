import { PartialType } from '@nestjs/mapped-types';
import { IsIn, IsOptional } from 'class-validator';
import { CreateListingDto } from './create-listing.dto';

export class UpdateListingDto extends PartialType(CreateListingDto) {
  @IsOptional()
  @IsIn(['ACTIVE', 'HIDDEN'])
  status?: 'ACTIVE' | 'HIDDEN';
}
