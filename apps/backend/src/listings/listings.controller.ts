import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { SessionGuard } from '../auth/session.guard';
import { users, type User } from '../auth/users.store';
import type { Listing } from './listings.store';
import { ListingsService } from './listings.service';
import { CreateListingDto } from './dto/create-listing.dto';

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

  @Get()
  getAll(): ListingWithOwner[] {
    return this.listings.getAll().map(enrichListing);
  }

  @Get(':id')
  getOne(@Param('id') id: string): ListingWithOwner {
    const listing = this.listings.getById(id);
    if (!listing) throw new NotFoundException('Listing not found');
    return enrichListing(listing);
  }

  @UseGuards(SessionGuard)
  @Get('my')
  my(@Req() req: Request): ListingWithOwner[] {
    const userId = req.session.userId;
    if (!userId) return [];
    return this.listings.getByOwner(userId).map(enrichListing);
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
