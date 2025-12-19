import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  Query,
  Delete,
} from '@nestjs/common';
import type { Request } from 'express';

import { SessionGuard } from '../auth/session.guard';
import { users, type User } from '../auth/users.store';
import type { Listing } from './listings.store';
import { ListingsService } from './listings.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';

type ListingWithOwner = Listing & {
  owner: Pick<User, 'id' | 'firstName' | 'lastName' | 'rating'> | null;
  landlordName: string;
  landlordRating: number;
};

function enrichListing(listing: Listing): ListingWithOwner {
  const owner = users.find((u) => u.id === listing.ownerId);

  const landlordName = owner
    ? `${owner.firstName} ${owner.lastName}`
    : 'Орендодавець';

  const landlordRating = owner?.rating ?? 0;

  return {
    ...listing,
    owner: owner
      ? {
          id: owner.id,
          firstName: owner.firstName,
          lastName: owner.lastName,
          rating: owner.rating,
        }
      : null,
    landlordName,
    landlordRating,
  };
}

@Controller('listings')
export class ListingsController {
  constructor(private readonly listings: ListingsService) {}

  // ✅ теперь поддерживает фильтр:
  // GET /listings?cityId=703448
  @Get()
  getAll(@Query('cityId') cityId?: string): ListingWithOwner[] {
    return this.listings.getAll({ cityId }).map(enrichListing);
  }

  @UseGuards(SessionGuard)
  @Get('my')
  my(@Req() req: Request): ListingWithOwner[] {
    const userId = req.session.userId!;
    return this.listings.getByOwner(userId).map(enrichListing);
  }

  @UseGuards(SessionGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() dto: UpdateListingDto,
  ): ListingWithOwner {
    const ownerId = req.session.userId!;
    const res = this.listings.update(id, ownerId, dto);

    if (res === null) throw new NotFoundException('Listing not found');
    if (res === 'FORBIDDEN')
      throw new ForbiddenException('You can edit only your listings');

    return enrichListing(res);
  }

  @UseGuards(SessionGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request): { ok: true } {
    const ownerId = req.session.userId!;
    const res = this.listings.delete(id, ownerId);

    if (res === null) throw new NotFoundException('Listing not found');
    if (res === 'FORBIDDEN')
      throw new ForbiddenException('You can delete only your listings');

    return { ok: true };
  }

  @Get(':id')
  getOne(@Param('id') id: string): ListingWithOwner {
    const listing = this.listings.getById(id);
    if (!listing) throw new NotFoundException('Listing not found');
    return enrichListing(listing);
  }

  @UseGuards(SessionGuard)
  @Post()
  create(
    @Req() req: Request,
    @Body() body: CreateListingDto,
  ): ListingWithOwner {
    const created = this.listings.create(req.session.userId!, body);
    return enrichListing(created);
  }
}
